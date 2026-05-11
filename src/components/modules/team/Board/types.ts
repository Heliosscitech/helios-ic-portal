export type UnitId = string;

export interface Unit {
  id: string;
  label: string;
  dotColor: string;
}

export type TaskStatus = string; // column id — artık dinamik
export type ViewMode = 'board' | 'list' | 'dashboard';
export type FilterScope = 'all' | 'assigned-to-me' | 'created-by-me';
export type Priority = 'low' | 'medium' | 'high';

export interface BoardColumn {
  id: string;
  title: string;
  dot: string; // tailwind bg-* class
}

export interface BoardTask {
  id: string;
  title: string;
  description?: string;
  unitId: UnitId;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assigneeIds: string[];
  creatorId: string;
  tags: string[];
  comments: number;
}

export interface BoardFilter {
  scope: FilterScope;
  unitId: UnitId | 'all';
  memberId: string | null;
  personIds: string[];
  tags: string[];
}

export const UNITS: Unit[] = [
  { id: 'arge', label: 'Ar-Ge', dotColor: 'bg-purple-500' },
  { id: 'is-gelistirme', label: 'İş Geliştirme', dotColor: 'bg-teal-500' },
  { id: 'uretim', label: 'Üretim', dotColor: 'bg-orange-500' },
  { id: 'satis', label: 'Satış', dotColor: 'bg-blue-500' },
  { id: 'idari', label: 'İdari', dotColor: 'bg-gray-400' },
];

export const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: 'todo', title: 'Yapılacak', dot: 'bg-gray-400' },
  { id: 'doing', title: 'Devam Ediyor', dot: 'bg-amber-500' },
  { id: 'done', title: 'Tamamlandı', dot: 'bg-teal-500' },
];

export const COLUMN_COLOR_PALETTE = [
  'bg-gray-400',
  'bg-amber-500',
  'bg-teal-500',
  'bg-info-border',
  'bg-purple-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-emerald-500',
];

export const columnTitle = (columns: BoardColumn[], id: string): string =>
  columns.find((c) => c.id === id)?.title ?? id;

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export const collectTags = (tasks: BoardTask[]): string[] => {
  const set = new Set<string>();
  tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
};
