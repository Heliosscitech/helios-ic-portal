import type { ProgramId } from './types';

export const PROGRAM_STYLES: Record<ProgramId, { bg: string; text: string; border: string }> = {
  tubitak_1501: { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  tubitak_1507: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  bigg:         { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  kosgeb:       { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
  eu_horizon:   { bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200'    },
  genel:        { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
};

export const PROGRAMS: Record<ProgramId, {
  id: ProgramId;
  name: string;
  shortName: string;
  icon: string;
  categories: { id: string; label: string; icon: string; formCode: string }[];
}> = {
  tubitak_1501: {
    id: 'tubitak_1501',
    name: 'TÜBİTAK 1501 / 1505',
    shortName: '1501',
    icon: '🔬',
    categories: [
      { id: 'personel',    label: 'Personel',                  icon: '👤', formCode: 'G011'   },
      { id: 'alet',        label: 'Alet / Teçhizat / Yazılım', icon: '🔬', formCode: 'G013'   },
      { id: 'malzeme',     label: 'Malzeme / Sarf',            icon: '📦', formCode: 'G016'   },
      { id: 'hizmet',      label: 'Yurtiçi Hizmet',            icon: '🔧', formCode: 'G015-A' },
      { id: 'arge_hizmet', label: 'Ar-Ge Hizmet',              icon: '🧪', formCode: 'G015-B' },
      { id: 'seyahat',     label: 'Seyahat',                   icon: '✈️', formCode: 'G017'   },
      { id: 'diger',       label: 'Diğer',                     icon: '📋', formCode: '-'      },
    ],
  },
  tubitak_1507: {
    id: 'tubitak_1507',
    name: 'TÜBİTAK 1507',
    shortName: '1507',
    icon: '🚀',
    categories: [
      { id: 'personel', label: 'Personel',        icon: '👤', formCode: 'G011' },
      { id: 'alet',     label: 'Alet / Teçhizat', icon: '🔬', formCode: 'G013' },
      { id: 'malzeme',  label: 'Malzeme / Sarf',  icon: '📦', formCode: 'G016' },
      { id: 'hizmet',   label: 'Hizmet Alımı',    icon: '🔧', formCode: 'G015' },
      { id: 'seyahat',  label: 'Seyahat',         icon: '✈️', formCode: 'G017' },
      { id: 'diger',    label: 'Diğer',           icon: '📋', formCode: '-'    },
    ],
  },
  bigg: {
    id: 'bigg',
    name: 'BİGG+',
    shortName: 'BİGG+',
    icon: '💡',
    categories: [
      { id: 'personel', label: 'Personel',        icon: '👤', formCode: 'P01' },
      { id: 'alet',     label: 'Makine/Teçhizat', icon: '🔬', formCode: 'P02' },
      { id: 'malzeme',  label: 'Malzeme / Sarf',  icon: '📦', formCode: 'P03' },
      { id: 'hizmet',   label: 'Hizmet Alımı',    icon: '🔧', formCode: 'P04' },
      { id: 'seyahat',  label: 'Seyahat',         icon: '✈️', formCode: 'P05' },
      { id: 'diger',    label: 'Diğer Giderler',  icon: '📋', formCode: 'P06' },
    ],
  },
  kosgeb: {
    id: 'kosgeb',
    name: 'KOSGEB',
    shortName: 'KOSGEB',
    icon: '🏭',
    categories: [
      { id: 'makine',   label: 'Makine / Teçhizat',     icon: '⚙️', formCode: 'MT' },
      { id: 'yazilim',  label: 'Yazılım',               icon: '💻', formCode: 'YZ' },
      { id: 'personel', label: 'Personel',              icon: '👤', formCode: 'PR' },
      { id: 'hizmet',   label: 'Hizmet Alımı',          icon: '🔧', formCode: 'HA' },
      { id: 'tanitim',  label: 'Tanıtım',               icon: '📢', formCode: 'TN' },
      { id: 'test',     label: 'Test / Analiz / Belge', icon: '🧪', formCode: 'TA' },
      { id: 'diger',    label: 'Diğer',                 icon: '📋', formCode: '-'  },
    ],
  },
  eu_horizon: {
    id: 'eu_horizon',
    name: 'AB / EU Horizon',
    shortName: 'EU',
    icon: '🇪🇺',
    categories: [
      { id: 'personnel',      label: 'Personnel Costs',        icon: '👤', formCode: 'WP-P' },
      { id: 'equipment',      label: 'Equipment',              icon: '🔬', formCode: 'WP-E' },
      { id: 'subcontracting', label: 'Subcontracting',         icon: '🔧', formCode: 'WP-S' },
      { id: 'travel',         label: 'Travel & Subsistence',   icon: '✈️', formCode: 'WP-T' },
      { id: 'consumables',    label: 'Other Goods & Services', icon: '📦', formCode: 'WP-O' },
      { id: 'indirect',       label: 'Indirect Costs (25%)',   icon: '📊', formCode: 'IC'   },
    ],
  },
  genel: {
    id: 'genel',
    name: 'Genel / Helios',
    shortName: 'Genel',
    icon: '☀️',
    categories: [
      { id: 'malzeme',  label: 'Malzeme',           icon: '📦', formCode: '-' },
      { id: 'hizmet',   label: 'Hizmet',            icon: '🔧', formCode: '-' },
      { id: 'personel', label: 'Personel',          icon: '👤', formCode: '-' },
      { id: 'seyahat',  label: 'Seyahat',           icon: '✈️', formCode: '-' },
      { id: 'alet',     label: 'Ekipman / Yazılım', icon: '🔬', formCode: '-' },
      { id: 'diger',    label: 'Diğer',             icon: '📋', formCode: '-' },
    ],
  },
};

export const KDV_ORANLARI = [0, 1, 10, 20];

export const BIRIMLER = ['adet', 'kg', 'lt', 'mt', 'kutu', 'paket', 'set', 'saat', 'gün', 'ay'];

export const PROJECT_TABS = [
  { id: 'ozet',       label: 'Özet'        },
  { id: 'harcamalar', label: 'Harcamalar'  },
  { id: 'gider-ekle', label: '+ Gider Ekle' },
  { id: 'onmuhasebe', label: 'Ön Muhasebe' },
  { id: 'raporlar',   label: 'Raporlar'    },
] as const;
