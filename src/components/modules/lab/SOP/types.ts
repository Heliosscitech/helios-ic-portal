export type SOPCategory =
  | 'sentez'
  | 'karakterizasyon'
  | 'kalite-kontrol'
  | 'guvenlik'
  | 'cihaz-kullanimi'
  | 'satin-alma'
  | 'ihracat-sevkiyat'
  | 'idari';

export interface SOPProcedure {
  id: string;
  title: string;
  category: SOPCategory;
  version: string;
  lastUpdated: string;     // ISO 'YYYY-MM-DD'
  ownerId: string;         // Helios legacy_id
  driveUrl?: string;
  summary?: string;
  tags: string[];
  createdAt: string;
}

export type SOPFormData = Omit<SOPProcedure, 'id' | 'createdAt'>;

export interface SOPCategoryMeta {
  id: SOPCategory;
  label: string;
  dot: string;
  badge: string;
  badgeText: string;
}

export const SOP_CATEGORIES: SOPCategoryMeta[] = [
  { id: 'sentez',           label: 'Sentez',            dot: 'bg-amber-500',   badge: 'bg-amber-bg',  badgeText: 'text-amber-text'  },
  { id: 'karakterizasyon',  label: 'Karakterizasyon',   dot: 'bg-text-3',      badge: 'bg-surface-2', badgeText: 'text-text-2'      },
  { id: 'kalite-kontrol',   label: 'Kalite Kontrol',    dot: 'bg-teal-500',    badge: 'bg-teal-bg',   badgeText: 'text-teal-text'   },
  { id: 'guvenlik',         label: 'Güvenlik',          dot: 'bg-red-500',     badge: 'bg-red-bg',    badgeText: 'text-red-text'    },
  { id: 'cihaz-kullanimi',  label: 'Cihaz Kullanımı',   dot: 'bg-emerald-500', badge: 'bg-teal-bg',   badgeText: 'text-teal-text'   },
  { id: 'satin-alma',       label: 'Satın Alma',        dot: 'bg-orange-400',  badge: 'bg-amber-bg',  badgeText: 'text-amber-text'  },
  { id: 'ihracat-sevkiyat', label: 'İhracat / Sevkiyat',dot: 'bg-purple-500',  badge: 'bg-purple-bg', badgeText: 'text-purple-text' },
  { id: 'idari',            label: 'İdari',             dot: 'bg-text-3',      badge: 'bg-surface-2', badgeText: 'text-text-2'      },
];

export const getCategoryMeta = (id: SOPCategory): SOPCategoryMeta =>
  SOP_CATEGORIES.find((c) => c.id === id) ?? SOP_CATEGORIES[0];
