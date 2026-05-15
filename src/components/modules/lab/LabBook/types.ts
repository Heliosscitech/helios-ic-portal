// ── Helios ELN / Lab Book types ──────────────────────────────────────────────

export type LabTabId = 'anasayfa' | 'mof-uretimi' | 'sekillendirme' | 'literatur' | 'egitim';

export type SubExperimentType = 'repeat' | 'scale_up' | 'parameter';

export const SUB_TYPE_LABEL: Record<SubExperimentType, string> = {
  repeat:    'Tekrar Deneyi',
  scale_up:  'Scale-up Deneyi',
  parameter: 'Parametre Deneyi',
};

export const SUB_TYPE_DETAIL_LABEL: Record<SubExperimentType, string> = {
  repeat:    'Tekrar Nedeni',
  scale_up:  'Scale-up Detayı',
  parameter: 'Değişen Parametre',
};

export interface MofCategory {
  id:        string;
  name:      string;
  position:  number;
  createdAt: string;
}

export interface Experiment {
  id:                 string;
  mofCategoryId:      string;
  shapingVariantId:   string | null;          // dolu ise şekillendirme deneyi
  parentId:           string | null;
  subType:            SubExperimentType | null;
  title:              string;
  batchNo:            string;
  referenceUrl:       string | null;
  authorId:           string | null;            // legacy ID
  experimentDate:     string;                   // YYYY-MM-DD
  yieldPct:           number | null;
  amount:             string | null;
  repeatReason:       string | null;
  scaleUpDetail:      string | null;
  parameterDetail:    string | null;
  generalOverview:    string | null;
  reasonDiff:         string | null;
  procedureEquipment: string | null;
  planResults:        string | null;
  createdAt:          string;
}

export interface ExperimentMaterial {
  id:           string;
  experimentId: string;
  name:         string;
  amount:       string | null;
  position:     number;
  createdAt:    string;
}

export interface ExperimentCharacterization {
  id:            string;
  experimentId:  string;
  type:          string;
  value:         string | null;
  notes:         string | null;                 // Sonuç / Yorum
  attachmentUrl: string | null;                 // Drive linki
  imageUrl:      string | null;                 // Yüklenen görsel (Supabase Storage)
  performedAt:   string | null;
  performedById: string | null;                 // legacy ID
  position:      number;
  createdAt:     string;
}

export const CHARACTERIZATION_TYPES = ['BET', 'SEM', 'XRD', 'TGA', 'FTIR', 'CO2 Tutum', 'Diğer'] as const;

export interface ShapingVariant {
  id:            string;
  mofCategoryId: string;
  name:          string;
  position:      number;
  createdAt:     string;
}

export interface LiteratureItem {
  id:           string;
  title:        string;
  authors:      string | null;
  journal:      string | null;
  year:         number | null;
  subject:      string | null;        // Konu / MOF
  doi:          string | null;
  url:          string | null;
  summary:      string | null;        // Özet (markdown)
  heliosNotes:  string | null;        // Helios için Notlar (markdown)
  addedBy:      string | null;
  createdAt:    string;
}

export const TRAINING_CATEGORIES = [
  'Cihaz Kullanımı',
  'Sentez Protokolü',
  'Karakterizasyon',
  'Güvenlik',
  'Yazılım',
  'Diğer',
] as const;

export const TRAINING_LEVELS = ['Başlangıç', 'Orta', 'İleri'] as const;

export interface Training {
  id:          string;
  title:       string;
  category:    string | null;   // TRAINING_CATEGORIES'den biri (esnek bırakıyoruz)
  level:       string | null;   // TRAINING_LEVELS'tan biri
  url:         string | null;
  purpose:     string | null;   // Amaç (markdown)
  steps:       string | null;   // Adımlar (markdown)
  safetyNotes: string | null;   // Uyarılar / Güvenlik (markdown)
  addedBy:     string | null;   // Hazırlayan
  createdAt:   string;
}

export const LAB_TABS: { id: LabTabId; label: string; icon: string }[] = [
  { id: 'anasayfa',      label: 'Anasayfa',           icon: 'home'   },
  { id: 'mof-uretimi',   label: 'MOF Üretimi',        icon: 'flask'  },
  { id: 'sekillendirme', label: 'Şekillendirme',      icon: 'layers' },
  { id: 'literatur',     label: 'Literatür Taraması', icon: 'book'   },
  { id: 'egitim',        label: 'Eğitim / Tutorial',  icon: 'cap'    },
];

// Türkçe ay kısaltmaları
const TR_MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

export const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${TR_MONTHS_SHORT[m - 1]} ${y}`;
};

export const formatDateShort = (iso: string | null): string => {
  if (!iso) return '—';
  return iso.slice(0, 10);
};
