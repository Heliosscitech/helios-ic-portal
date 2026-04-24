export type UnitId = 'arge' | 'is-gelistirme' | 'uretim' | 'satis' | 'idari';

export interface Unit {
  id: UnitId;
  label: string;
  dotColor: string;
}

export type TaskStatus = 'todo' | 'doing' | 'done';
export type ViewMode = 'board' | 'list' | 'dashboard';
export type FilterScope = 'all' | 'assigned-to-me' | 'created-by-me';
export type Priority = 'low' | 'medium' | 'high';

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

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Yapılacak',
  doing: 'Devam Ediyor',
  done: 'Tamamlandı',
};

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
