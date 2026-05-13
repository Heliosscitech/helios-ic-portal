export type DLStatus = 'backlog' | 'todo' | 'inprogress' | 'completed';

export interface DLGroup {
  id:        string;
  title:     string;
  position:  number;
  createdAt: string;
}

export interface DLItem {
  id:          string;
  groupId:     string;
  title:       string;
  notes?:      string;
  status:      DLStatus;
  position:    number;
  assigneeIds: string[];
  dueDate:     string | null;
  tags:        string[];
  createdAt:   string;
  completedAt: string | null;
  deleted:     boolean;
  deletedAt:   string | null;
}

export interface DLComment {
  id:        string;
  itemId:    string;
  authorId:  string;
  body:      string;
  createdAt: string;
}

export interface DLSubtask {
  id:        string;
  itemId:    string;
  title:     string;
  completed: boolean;
  position:  number;
  createdAt: string;
}

export interface DLColumn {
  id:    DLStatus;
  label: string;
  dot:   string;
}

export const DL_COLUMNS: DLColumn[] = [
  { id: 'backlog',    label: 'Backlog',      dot: 'bg-gray-400'  },
  { id: 'todo',       label: 'Yapılacak',    dot: 'bg-blue-500'  },
  { id: 'inprogress', label: 'Devam Ediyor', dot: 'bg-amber-500' },
  { id: 'completed',  label: 'Tamamlandı',   dot: 'bg-teal-500'  },
];

export const DL_ITEM_DRAG_MIME = 'application/x-helios-dl-item-id';
export const AUTO_DELETE_DAYS  = 15;

const TR_MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

export const formatDT = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '—';
  return `${d} ${TR_MONTHS_SHORT[m - 1]} ${y}`;
};
