export type ProgramId = 'tubitak_1501' | 'tubitak_1507' | 'bigg' | 'kosgeb' | 'eu_horizon' | 'genel';

export type ProjectTab = 'ozet' | 'harcamalar' | 'onmuhasebe' | 'raporlar' | 'gider-ekle';

export type NavState =
  | { screen: 'list' }
  | { screen: 'detail'; projectId: string; tab: ProjectTab };

export interface MuhasebeCategory {
  id: string;
  label: string;
  icon: string;
  formCode: string;
}

export interface MuhasebeRecord {
  id: string;
  projeId: string;
  kategori: string;
  tarih: string;
  belgeNo: string;
  belgeTarih: string;
  tutarKDVHaric: number;
  tutarKDVDahil: number;
  kdvOrani: number;
  paraBirimi: 'TRY' | 'USD';
  yurtdisiAlimi: 'evet' | 'hayir';
  notlar: string;
  malzemeAdi?: string;
  aciklama?: string;
  firma?: string;
  birim?: string;
  miktar?: number;
  birimFiyat?: number;
  formSiraNo?: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  projeId: string;
  tarih: string;
  tip: 'gelir' | 'gider';
  aciklama: string;
  tutar: number;
  paraBirimi: 'TRY' | 'USD';
  hesap?: string;
  referansId?: string;   // set when auto-mirrored from a hibe project expense
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  no: string;
  program: ProgramId;
  budget: number;
  records: MuhasebeRecord[];
  omRecords: LedgerEntry[];
  createdAt: string;
  isGenel?: boolean;
}

export interface MonthlyRow {
  month: string;
  gelir_try: number;
  gelir_usd: number;
  gider_try: number;
  gider_usd: number;
  entry_count: number;
}

export interface ProjectFormData {
  name: string;
  no: string;
  program: ProgramId;
  budget: number;
}

export interface LedgerFormData {
  tarih: string;
  tip: 'gelir' | 'gider';
  aciklama: string;
  tutar: number;
  paraBirimi: 'TRY' | 'USD';
  hesap?: string;
}
