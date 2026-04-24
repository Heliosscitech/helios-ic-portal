export interface ChecklistItem {
  id: string;
  name: string;
  instruction: string;
  isCustom?: boolean;
}

export interface ItemStatus {
  type: 'ok' | 'problem' | null;
  comment?: string;
  assigneeId?: string;
  timestamp?: string;
  userInitials?: string;
  userName?: string;
}

export interface ChecklistTabData {
  sorumlu: string;
  items: ChecklistItem[];
}

export type ChecklistTabId = 'haftalik' | 'aylik' | 'temizlik';

export interface ChecklistTab {
  id: ChecklistTabId;
  label: string;
}

export const TABS: ChecklistTab[] = [
  { id: 'haftalik', label: 'Haftalık kontrol' },
  { id: 'aylik', label: 'Aylık kontrol' },
  { id: 'temizlik', label: 'Temizlik' },
];

// Hafta/ay anahtarı — history ve customItems Record<TabId, ...> olarak kullanılıyor
export type ChecklistHistory = Record<string, Record<string, ItemStatus>>;
export type CustomItemsMap = Record<ChecklistTabId, ChecklistItem[]>;
