import type { AnalysisState, ExperimentStatus } from './types';

export const EXPERIMENTS_KEY = 'helios:arge:experiments:v1';
export const DEVICES_KEY = 'helios:arge:devices:v1';

export const DEFAULT_DEVICES: string[] = [
  'Etüv',
  'HSM',
  'Reflüks',
  'Otoklav',
  'Ultrasonik',
  'Vakum fırın',
  'Manyetik karıştırıcı',
];

interface StatusMeta {
  label: string;
  pill: string;
}

export const STATUS_META: Record<ExperimentStatus, StatusMeta> = {
  'bekliyor':   { label: 'Bekliyor',   pill: 'bg-surface-2 text-text-2' },
  'yapiliyor':  { label: 'Yapılıyor',  pill: 'bg-amber-bg text-amber-text' },
  'tamamlandi': { label: 'Tamamlandı', pill: 'bg-teal-bg text-teal-text' },
};

export const STATUS_ORDER: ExperimentStatus[] = ['bekliyor', 'yapiliyor', 'tamamlandi'];

interface AnalysisMeta {
  label: string;
  pill: string;
}

export const ANALYSIS_META: Record<Exclude<AnalysisState, ''>, AnalysisMeta> = {
  'planned': { label: 'Yapılacak', pill: 'bg-amber-bg text-amber-text' },
  'done':    { label: 'Yapıldı',   pill: 'bg-teal-bg text-teal-text' },
};
