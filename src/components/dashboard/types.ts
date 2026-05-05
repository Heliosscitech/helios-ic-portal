export type Priority = 'normal' | 'onemli' | 'acil';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  createdById?: string;        // legacy_id (PORTAL_USERS.id)
  createdAt: string;
}

export interface DirectoryGroup {
  id: string;
  name: string;
  color: string;               // tailwind class pair, e.g. 'bg-teal-bg text-teal-text'
  position: number;
  createdAt: string;
}

export interface DirectoryContact {
  id: string;
  groupId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
  position: number;
  createdAt: string;
}

export type IdentityCategory = 'adresler' | 'sabit-hatlar' | 'sirket-bilgileri';

export interface IdentityEntry {
  id: string;
  category: IdentityCategory;
  label: string;
  value: string;
  position: number;
}

export type NoteCategory = 'genel' | 'giris-bilgileri' | 'kargo-adresleri';

export interface Note {
  id: string;
  category: NoteCategory;
  title: string;
  content: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  normal: 'NORMAL',
  onemli: 'ÖNEMLİ',
  acil: 'ACİL',
};

export const PRIORITY_STYLES: Record<Priority, { bar: string; badge: string }> = {
  normal: { bar: 'border-l-text-3', badge: 'bg-surface-2 text-text-3' },
  onemli: { bar: 'border-l-amber-text', badge: 'bg-amber-bg text-amber-text' },
  acil:   { bar: 'border-l-red-500',   badge: 'bg-red-50 text-red-500' },
};

export const IDENTITY_CATEGORIES: { id: IdentityCategory; label: string }[] = [
  { id: 'adresler', label: 'Adresler' },
  { id: 'sabit-hatlar', label: 'Sabit hatlar' },
  { id: 'sirket-bilgileri', label: 'Şirket bilgileri' },
];

export const NOTE_CATEGORIES: { id: NoteCategory; label: string }[] = [
  { id: 'genel', label: 'Genel notlar' },
  { id: 'giris-bilgileri', label: 'Giriş bilgileri' },
  { id: 'kargo-adresleri', label: 'Kargo adresleri' },
];

// Rehber gruplarına otomatik atanacak renk paleti (oluşturma sırasına göre cycle).
export const GROUP_COLOR_PALETTE: string[] = [
  'bg-teal-bg text-teal-text',
  'bg-amber-bg text-amber-text',
  'bg-info-bg text-info-text',
  'bg-purple-bg text-purple-text',
  'bg-pink-bg text-pink-text',
  'bg-red-bg text-red-text',
];

export interface QuickLink {
  id: string;
  name: string;
  description: string;
  url: string;
  initial: string;
  color: string;       // tailwind class pair, örn. 'bg-red-50 text-red-500'
  position: number;
}

export const LINK_COLOR_PALETTE: string[] = [
  'bg-red-50 text-red-500',
  'bg-orange-50 text-orange-500',
  'bg-amber-50 text-amber-500',
  'bg-emerald-50 text-emerald-500',
  'bg-teal-50 text-teal-500',
  'bg-blue-50 text-blue-500',
  'bg-indigo-50 text-indigo-500',
  'bg-purple-50 text-purple-500',
];
