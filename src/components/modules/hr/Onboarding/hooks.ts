import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import { toast } from '../../../../lib/toast';
import type {
  OnboardingPerson,
  OnboardingTemplate,
  PersonPhase,
  PersonTask,
} from './types';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ── People (Kişiler) ───────────────────────────────────────────────────

type DbTask = {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  is_done: boolean;
  position: number;
};

type DbPhase = {
  id: string;
  person_id: string;
  title: string;
  position: number;
};

type DbPerson = {
  id: string;
  name: string;
  role: string | null;
  start_date: string | null;
  owner_id: string | null;
};

const sortByPosition = <T extends { position: number }>(arr: T[]): T[] =>
  [...arr].sort((a, b) => a.position - b.position);

const toTask = (row: DbTask): PersonTask => ({
  id: row.id,
  title: row.title,
  description: row.description ?? '',
  assignee: row.assignee ?? '',
  isDone: row.is_done,
});

let peopleCache: OnboardingPerson[] | null = null;
const peopleListeners = new Set<(p: OnboardingPerson[]) => void>();
const broadcastPeople = (next: OnboardingPerson[]) => {
  peopleCache = next;
  peopleListeners.forEach((cb) => cb(next));
};

const fetchPeople = async (): Promise<OnboardingPerson[]> => {
  await ensureUsersLoaded();

  // 3 ayrı sorgu — nested embed güvenilir değil
  const [peopleRes, phasesRes, tasksRes] = await Promise.all([
    supabase.from('onboarding_people').select('id, name, role, start_date, owner_id').order('created_at', { ascending: true }),
    supabase.from('onboarding_phases').select('id, person_id, title, position').order('position'),
    supabase.from('onboarding_tasks').select('id, phase_id, title, description, assignee, is_done, position').order('position'),
  ]);

  if (peopleRes.error) {
    console.error('onboarding_people fetch failed', peopleRes.error);
    return peopleCache ?? [];
  }
  if (phasesRes.error) console.error('onboarding_phases fetch failed', phasesRes.error);
  if (tasksRes.error) console.error('onboarding_tasks fetch failed', tasksRes.error);

  const people = (peopleRes.data ?? []) as DbPerson[];
  const phases = (phasesRes.data ?? []) as DbPhase[];
  const tasks = (tasksRes.data ?? []) as DbTask[];

  // Her phase için tasks listesi
  const tasksByPhase = new Map<string, DbTask[]>();
  for (const t of tasks) {
    const arr = tasksByPhase.get(t.phase_id) ?? [];
    arr.push(t);
    tasksByPhase.set(t.phase_id, arr);
  }

  // Her person için phases listesi
  const phasesByPerson = new Map<string, DbPhase[]>();
  for (const ph of phases) {
    const arr = phasesByPerson.get(ph.person_id) ?? [];
    arr.push(ph);
    phasesByPerson.set(ph.person_id, arr);
  }

  return people.map((p): OnboardingPerson => ({
    id: p.id,
    name: p.name,
    role: p.role ?? '',
    startDate: p.start_date ?? '',
    ownerId: p.owner_id ? dbToLegacyId(p.owner_id) ?? p.owner_id : undefined,
    phases: sortByPosition(phasesByPerson.get(p.id) ?? []).map((ph): PersonPhase => ({
      id: ph.id,
      title: ph.title,
      tasks: sortByPosition(tasksByPhase.get(ph.id) ?? []).map(toTask),
    })),
  }));
};

export type PersonInput = {
  name: string;
  role: string;
  startDate: string;
  ownerLegacyId?: string;
};

export function useOnboardingPeople() {
  const [people, setPeople] = useState<OnboardingPerson[]>(peopleCache ?? []);
  const [loading, setLoading] = useState(peopleCache === null);

  useEffect(() => {
    const cb = (next: OnboardingPerson[]) => setPeople(next);
    peopleListeners.add(cb);
    if (peopleCache === null) {
      fetchPeople().then((list) => {
        broadcastPeople(list);
        setLoading(false);
      });
    } else {
      setPeople(peopleCache);
      setLoading(false);
    }
    return () => {
      peopleListeners.delete(cb);
    };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchPeople();
    broadcastPeople(list);
  }, []);

  const addPerson = useCallback(
    async (input: PersonInput, template: OnboardingTemplate): Promise<OnboardingPerson | null> => {
      await ensureUsersLoaded();
      const ownerDbId = input.ownerLegacyId ? legacyToDbId(input.ownerLegacyId) ?? null : null;
      const personId = newId();

      const { error: pErr } = await supabase.from('onboarding_people').insert({
        id: personId,
        name: input.name,
        role: input.role || null,
        start_date: input.startDate || null,
        owner_id: ownerDbId,
      });
      if (pErr) {
        console.error('onboarding_people insert failed', pErr);
        toast.error('Kişi kaydedilemedi:\n' + pErr.message);
        return null;
      }

      if (template.length === 0) {
        toast.error(
          'Şablon boş olduğu için kişiye faz/görev eklenmedi. Önce "Şablonu düzenle" ile faz ve görev ekleyin, sonra kişiyi tekrar oluşturun.'
        );
      }

      // Template'i kişinin phase + task satırlarına klonla
      const errors: string[] = [];
      for (let pIdx = 0; pIdx < template.length; pIdx++) {
        const phase = template[pIdx];
        const phaseId = newId();
        const { error: phErr } = await supabase.from('onboarding_phases').insert({
          id: phaseId,
          person_id: personId,
          title: phase.title,
          position: pIdx,
        });
        if (phErr) {
          console.error('phase insert failed', phErr, { phase, phaseId, personId });
          errors.push(`Faz "${phase.title}" eklenemedi: ${phErr.message}`);
          continue;
        }
        const taskRows = phase.tasks.map((t, tIdx) => ({
          id: newId(),
          phase_id: phaseId,
          title: t.title,
          description: t.description || null,
          assignee: t.assignee || null,
          is_done: false,
          position: tIdx,
        }));
        if (taskRows.length > 0) {
          const { error: tErr } = await supabase.from('onboarding_tasks').insert(taskRows);
          if (tErr) {
            console.error('tasks insert failed', tErr, { taskRows });
            errors.push(`"${phase.title}" görevleri eklenemedi: ${tErr.message}`);
          }
        }
      }

      if (errors.length > 0) {
        toast.error('Bazı faz/görevler eklenemedi:\n\n' + errors.join('\n'));
      }

      await refresh();
      return peopleCache?.find((p) => p.id === personId) ?? null;
    },
    [refresh]
  );

  const updatePerson = useCallback(
    async (id: string, input: PersonInput) => {
      await ensureUsersLoaded();
      const ownerDbId = input.ownerLegacyId ? legacyToDbId(input.ownerLegacyId) ?? null : null;

      // optimistic
      broadcastPeople(
        (peopleCache ?? []).map((p) =>
          p.id === id
            ? {
                ...p,
                name: input.name,
                role: input.role,
                startDate: input.startDate,
                ownerId: input.ownerLegacyId,
              }
            : p
        )
      );

      const { error, count } = await supabase
        .from('onboarding_people')
        .update(
          {
            name: input.name,
            role: input.role || null,
            start_date: input.startDate || null,
            owner_id: ownerDbId,
          },
          { count: 'exact' }
        )
        .eq('id', id);
      if (error) {
        console.error('person update failed', error);
        toast.error('Güncellenemedi:\n' + error.message);
        await refresh();
      } else if (count === 0) {
        toast.error('Bu kaydı güncelleme yetkiniz yok.');
        await refresh();
      }
    },
    [refresh]
  );

  const deletePerson = useCallback(async (id: string) => {
    broadcastPeople((peopleCache ?? []).filter((p) => p.id !== id));
    const { error, count } = await supabase
      .from('onboarding_people')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('person delete failed', error);
      toast.error('Silinemedi:\n' + error.message);
      await refresh();
    } else if (count === 0) {
      toast.error('Bu kaydı silme yetkiniz yok.');
      await refresh();
    }
  }, [refresh]);

  const resyncFromTemplate = useCallback(async (personId: string) => {
    const { error } = await supabase.rpc('resync_person_from_template', {
      p_person_id: personId,
    });
    if (error) {
      console.error('resync_person_from_template failed', error);
      toast.error('Şablondan yenileme başarısız:\n' + error.message);
      return false;
    }
    await refresh();
    return true;
  }, [refresh]);

  const toggleTask = useCallback(async (taskId: string, currentIsDone: boolean) => {
    // optimistic — cache içinde update
    broadcastPeople(
      (peopleCache ?? []).map((p) => ({
        ...p,
        phases: p.phases.map((ph) => ({
          ...ph,
          tasks: ph.tasks.map((t) => (t.id === taskId ? { ...t, isDone: !currentIsDone } : t)),
        })),
      }))
    );
    const { error, count } = await supabase
      .from('onboarding_tasks')
      .update({ is_done: !currentIsDone }, { count: 'exact' })
      .eq('id', taskId);
    if (error) {
      console.error('task toggle failed', error);
      toast.error('Görev güncellenemedi:\n' + error.message);
      await refresh();
    } else if (count === 0) {
      toast.error('Bu görevi güncelleme yetkiniz yok.');
      await refresh();
    }
  }, [refresh]);

  return { people, loading, addPerson, updatePerson, deletePerson, toggleTask, resyncFromTemplate, refresh };
}

// ── Template (Şablon) ─────────────────────────────────────────────────

type DbTaskTemplate = {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  position: number;
};

type DbPhaseTemplate = {
  id: string;
  title: string;
  position: number;
};

let templateCache: OnboardingTemplate | null = null;
const templateListeners = new Set<(t: OnboardingTemplate) => void>();
const broadcastTemplate = (next: OnboardingTemplate) => {
  templateCache = next;
  templateListeners.forEach((cb) => cb(next));
};

const fetchTemplate = async (): Promise<OnboardingTemplate> => {
  const [phasesRes, tasksRes] = await Promise.all([
    supabase.from('onboarding_phase_templates').select('id, title, position').order('position'),
    supabase.from('onboarding_task_templates').select('id, template_id, title, description, assignee, position').order('position'),
  ]);

  if (phasesRes.error) {
    console.error('onboarding_phase_templates fetch failed', phasesRes.error);
    return templateCache ?? [];
  }
  if (tasksRes.error) console.error('onboarding_task_templates fetch failed', tasksRes.error);

  const phases = (phasesRes.data ?? []) as DbPhaseTemplate[];
  const tasks = (tasksRes.data ?? []) as DbTaskTemplate[];

  const tasksByTemplate = new Map<string, DbTaskTemplate[]>();
  for (const t of tasks) {
    const arr = tasksByTemplate.get(t.template_id) ?? [];
    arr.push(t);
    tasksByTemplate.set(t.template_id, arr);
  }

  return sortByPosition(phases).map((p) => ({
    id: p.id,
    title: p.title,
    tasks: sortByPosition(tasksByTemplate.get(p.id) ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? '',
      assignee: t.assignee ?? '',
    })),
  }));
};

export function useOnboardingTemplate() {
  const [template, setTemplate] = useState<OnboardingTemplate>(templateCache ?? []);
  const [loading, setLoading] = useState(templateCache === null);

  useEffect(() => {
    const cb = (next: OnboardingTemplate) => setTemplate(next);
    templateListeners.add(cb);
    if (templateCache === null) {
      fetchTemplate().then((list) => {
        broadcastTemplate(list);
        setLoading(false);
      });
    } else {
      setTemplate(templateCache);
      setLoading(false);
    }
    return () => {
      templateListeners.delete(cb);
    };
  }, []);

  const saveTemplate = useCallback(async (next: OnboardingTemplate) => {
    // optimistic
    broadcastTemplate(next);

    // Atomik replace — tek transaction, FK race yok
    const { error } = await supabase.rpc('replace_onboarding_template', {
      template: next.map((p) => ({
        title: p.title,
        tasks: p.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          assignee: t.assignee,
        })),
      })),
    });

    if (error) {
      console.error('replace_onboarding_template failed', error);
      toast.error('Şablon kaydedilemedi:\n' + error.message);
    }

    const fresh = await fetchTemplate();
    broadcastTemplate(fresh);
  }, []);

  return { template, loading, saveTemplate };
}
