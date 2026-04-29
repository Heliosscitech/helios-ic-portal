import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import type {
  NewProjectFormData,
  Project,
  ProjectStatus,
  ReportPeriod,
  WPStatus,
  WorkPackage,
} from './types';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

type DbProject = {
  id: string;
  code: string;
  name: string;
  subtitle: string | null;
  color: string;
  start_date: string | null;
  end_date: string | null;
  leader_id: string;
  status: ProjectStatus;
  notes: string | null;
};

type DbMember = { project_id: string; user_id: string };

type DbWP = {
  id: string;
  project_id: string;
  title: string;
  status: WPStatus;
  deadline: string | null;
  notes: string | null;
  position: number;
};

type DbReport = {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  status: WPStatus;
  position: number;
};

const sortByPosition = <T extends { position: number }>(arr: T[]): T[] =>
  [...arr].sort((a, b) => a.position - b.position);

const fetchAll = async (): Promise<Project[]> => {
  await ensureUsersLoaded();

  const [projRes, memberRes, wpRes, reportRes] = await Promise.all([
    supabase.from('projects').select('id, code, name, subtitle, color, start_date, end_date, leader_id, status, notes').order('created_at', { ascending: true }),
    supabase.from('project_members').select('project_id, user_id'),
    supabase.from('project_work_packages').select('id, project_id, title, status, deadline, notes, position').order('position'),
    supabase.from('project_report_periods').select('id, project_id, title, due_date, status, position').order('position'),
  ]);

  if (projRes.error) {
    console.error('projects fetch failed', projRes.error);
    return [];
  }
  if (memberRes.error) console.error('project_members fetch failed', memberRes.error);
  if (wpRes.error) console.error('project_work_packages fetch failed', wpRes.error);
  if (reportRes.error) console.error('project_report_periods fetch failed', reportRes.error);

  const projects = (projRes.data ?? []) as DbProject[];
  const members = (memberRes.data ?? []) as DbMember[];
  const wps = (wpRes.data ?? []) as DbWP[];
  const reports = (reportRes.data ?? []) as DbReport[];

  const membersByProj = new Map<string, string[]>();
  for (const m of members) {
    const arr = membersByProj.get(m.project_id) ?? [];
    arr.push(m.user_id);
    membersByProj.set(m.project_id, arr);
  }
  const wpsByProj = new Map<string, DbWP[]>();
  for (const w of wps) {
    const arr = wpsByProj.get(w.project_id) ?? [];
    arr.push(w);
    wpsByProj.set(w.project_id, arr);
  }
  const reportsByProj = new Map<string, DbReport[]>();
  for (const r of reports) {
    const arr = reportsByProj.get(r.project_id) ?? [];
    arr.push(r);
    reportsByProj.set(r.project_id, arr);
  }

  return projects.map((p): Project => ({
    id: p.id,
    code: p.code,
    name: p.name,
    subtitle: p.subtitle ?? undefined,
    color: p.color,
    startDate: p.start_date ?? '',
    endDate: p.end_date ?? '',
    leaderId: dbToLegacyId(p.leader_id) ?? p.leader_id,
    memberIds: (membersByProj.get(p.id) ?? [])
      .map((uid) => dbToLegacyId(uid))
      .filter((v): v is string => Boolean(v)),
    status: p.status,
    workPackages: sortByPosition(wpsByProj.get(p.id) ?? []).map((w): WorkPackage => ({
      id: w.id,
      title: w.title,
      status: w.status,
      deadline: w.deadline ?? '',
      notes: w.notes ?? '',
    })),
    reportPeriods: sortByPosition(reportsByProj.get(p.id) ?? []).map((r): ReportPeriod => ({
      id: r.id,
      title: r.title,
      date: r.due_date ?? '',
      status: r.status,
    })),
    notes: p.notes ?? '',
  }));
};

let cache: Project[] | null = null;
const listeners = new Set<(arr: Project[]) => void>();
const broadcast = (next: Project[]) => {
  cache = next;
  listeners.forEach((cb) => cb(next));
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    const cb = (next: Project[]) => setProjects(next);
    listeners.add(cb);
    if (cache === null) {
      fetchAll().then((list) => {
        broadcast(list);
        setLoading(false);
      });
    } else {
      setProjects(cache);
      setLoading(false);
    }
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchAll();
    broadcast(list);
  }, []);

  // ── Project CRUD ──────────────────────────────────────────

  const addProject = useCallback(async (data: NewProjectFormData): Promise<Project | null> => {
    await ensureUsersLoaded();
    const leaderDbId = legacyToDbId(data.leaderId);
    if (!leaderDbId) {
      window.alert('Lider kullanıcı bulunamadı.');
      return null;
    }
    const id = newId();
    const { error: pErr } = await supabase.from('projects').insert({
      id,
      code: data.code,
      name: data.name,
      subtitle: data.subtitle || data.code,
      color: 'bg-info-border',
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      leader_id: leaderDbId,
      status: 'aktif',
      notes: '',
    });
    if (pErr) {
      console.error('project insert failed', pErr);
      window.alert('Proje kaydedilemedi:\n' + pErr.message);
      return null;
    }

    // members
    const memberRows = data.memberIds
      .map((legacy) => legacyToDbId(legacy))
      .filter((v): v is string => Boolean(v))
      .map((uid) => ({ project_id: id, user_id: uid }));
    if (memberRows.length > 0) {
      const { error: mErr } = await supabase.from('project_members').insert(memberRows);
      if (mErr) console.error('project_members insert failed', mErr);
    }

    await refresh();
    return cache?.find((p) => p.id === id) ?? null;
  }, [refresh]);

  const updateProjectMeta = useCallback(async (id: string, data: NewProjectFormData) => {
    await ensureUsersLoaded();
    const leaderDbId = legacyToDbId(data.leaderId);
    if (!leaderDbId) {
      window.alert('Lider kullanıcı bulunamadı.');
      return;
    }

    const { error: pErr } = await supabase.from('projects').update({
      code: data.code,
      name: data.name,
      subtitle: data.subtitle || null,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      leader_id: leaderDbId,
    }).eq('id', id);

    if (pErr) {
      console.error('project update failed', pErr);
      window.alert('Güncellenemedi:\n' + pErr.message);
      await refresh();
      return;
    }

    // Members: delete + reinsert
    await supabase.from('project_members').delete().eq('project_id', id);
    const memberRows = data.memberIds
      .map((legacy) => legacyToDbId(legacy))
      .filter((v): v is string => Boolean(v))
      .map((uid) => ({ project_id: id, user_id: uid }));
    if (memberRows.length > 0) {
      const { error: mErr } = await supabase.from('project_members').insert(memberRows);
      if (mErr) console.error('project_members insert failed', mErr);
    }

    await refresh();
  }, [refresh]);

  const deleteProject = useCallback(async (id: string) => {
    broadcast((cache ?? []).filter((p) => p.id !== id));
    const { error, count } = await supabase
      .from('projects')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('project delete failed', error);
      window.alert('Silinemedi:\n' + error.message);
      await refresh();
    } else if (count === 0) {
      window.alert('Bu projeyi silme yetkiniz yok.');
      await refresh();
    }
  }, [refresh]);

  const updateProjectNotes = useCallback(async (id: string, notes: string) => {
    broadcast((cache ?? []).map((p) => (p.id === id ? { ...p, notes } : p)));
    const { error } = await supabase
      .from('projects')
      .update({ notes })
      .eq('id', id);
    if (error) {
      console.error('project notes update failed', error);
      await refresh();
    }
  }, [refresh]);

  // ── Work Packages ─────────────────────────────────────────

  const addWP = useCallback(async (projectId: string) => {
    const proj = (cache ?? []).find((p) => p.id === projectId);
    const nextPos = proj?.workPackages.length ?? 0;
    const newWp: WorkPackage = {
      id: newId(),
      title: '',
      status: 'bekliyor',
      deadline: '',
      notes: '',
    };
    broadcast(
      (cache ?? []).map((p) =>
        p.id === projectId ? { ...p, workPackages: [...p.workPackages, newWp] } : p
      )
    );
    const { error } = await supabase.from('project_work_packages').insert({
      id: newWp.id,
      project_id: projectId,
      title: '',
      status: 'bekliyor',
      deadline: null,
      notes: null,
      position: nextPos,
    });
    if (error) {
      console.error('WP insert failed', error);
      window.alert('İş paketi eklenemedi:\n' + error.message);
      await refresh();
    }
  }, [refresh]);

  const updateWP = useCallback(async (projectId: string, wpId: string, patch: Partial<WorkPackage>) => {
    broadcast(
      (cache ?? []).map((p) =>
        p.id === projectId
          ? {
              ...p,
              workPackages: p.workPackages.map((wp) =>
                wp.id === wpId ? { ...wp, ...patch } : wp
              ),
            }
          : p
      )
    );
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.deadline !== undefined) dbPatch.deadline = patch.deadline || null;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    const { error } = await supabase
      .from('project_work_packages')
      .update(dbPatch)
      .eq('id', wpId);
    if (error) {
      console.error('WP update failed', error);
      await refresh();
    }
  }, [refresh]);

  const deleteWP = useCallback(async (projectId: string, wpId: string) => {
    broadcast(
      (cache ?? []).map((p) =>
        p.id === projectId
          ? { ...p, workPackages: p.workPackages.filter((wp) => wp.id !== wpId) }
          : p
      )
    );
    const { error } = await supabase
      .from('project_work_packages')
      .delete()
      .eq('id', wpId);
    if (error) {
      console.error('WP delete failed', error);
      await refresh();
    }
  }, [refresh]);

  // ── Report Periods ────────────────────────────────────────

  const addReportPeriod = useCallback(async (projectId: string) => {
    const proj = (cache ?? []).find((p) => p.id === projectId);
    const nextPos = proj?.reportPeriods.length ?? 0;
    const newR: ReportPeriod = {
      id: newId(),
      title: '',
      date: '',
      status: 'bekliyor',
    };
    broadcast(
      (cache ?? []).map((p) =>
        p.id === projectId ? { ...p, reportPeriods: [...p.reportPeriods, newR] } : p
      )
    );
    const { error } = await supabase.from('project_report_periods').insert({
      id: newR.id,
      project_id: projectId,
      title: '',
      due_date: null,
      status: 'bekliyor',
      position: nextPos,
    });
    if (error) {
      console.error('report period insert failed', error);
      window.alert('Rapor dönemi eklenemedi:\n' + error.message);
      await refresh();
    }
  }, [refresh]);

  const updateReportPeriod = useCallback(async (projectId: string, periodId: string, patch: Partial<ReportPeriod>) => {
    broadcast(
      (cache ?? []).map((p) =>
        p.id === projectId
          ? {
              ...p,
              reportPeriods: p.reportPeriods.map((r) =>
                r.id === periodId ? { ...r, ...patch } : r
              ),
            }
          : p
      )
    );
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.date !== undefined) dbPatch.due_date = patch.date || null;
    const { error } = await supabase
      .from('project_report_periods')
      .update(dbPatch)
      .eq('id', periodId);
    if (error) {
      console.error('report period update failed', error);
      await refresh();
    }
  }, [refresh]);

  const deleteReportPeriod = useCallback(async (projectId: string, periodId: string) => {
    broadcast(
      (cache ?? []).map((p) =>
        p.id === projectId
          ? { ...p, reportPeriods: p.reportPeriods.filter((r) => r.id !== periodId) }
          : p
      )
    );
    const { error } = await supabase
      .from('project_report_periods')
      .delete()
      .eq('id', periodId);
    if (error) {
      console.error('report period delete failed', error);
      await refresh();
    }
  }, [refresh]);

  return {
    projects,
    loading,
    addProject,
    updateProjectMeta,
    deleteProject,
    updateProjectNotes,
    addWP,
    updateWP,
    deleteWP,
    addReportPeriod,
    updateReportPeriod,
    deleteReportPeriod,
    refresh,
  };
}
