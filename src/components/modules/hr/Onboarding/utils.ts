import type {
  OnboardingPerson,
  OnboardingTemplate,
  PersonPhase,
} from './types';

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
  return (first + last).toUpperCase();
};

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

export const getProgress = (person: OnboardingPerson): Progress => {
  const all = person.phases.flatMap((p) => p.tasks);
  const done = all.filter((t) => t.isDone).length;
  const total = all.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
};

export const cloneTemplateToPerson = (template: OnboardingTemplate): PersonPhase[] => {
  const stamp = Date.now().toString(36);
  return template.map((phase, pIdx) => ({
    id: `${stamp}-p${pIdx}`,
    title: phase.title,
    tasks: phase.tasks.map((t, tIdx) => ({
      id: `${stamp}-p${pIdx}-t${tIdx}`,
      title: t.title,
      description: t.description,
      assignee: t.assignee,
      isDone: false,
    })),
  }));
};

export const formatDateTR = (iso: string): string => {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};
