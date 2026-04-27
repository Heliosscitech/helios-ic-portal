export type ExperimentStatus = 'bekliyor' | 'yapiliyor' | 'tamamlandi';

export type AnalysisState = '' | 'planned' | 'done';

export interface Experiment {
  id: string;
  code: string;
  mof: string;
  name: string;
  purpose: string;
  ownerId: string;
  device: string;
  startDate: string;
  endDate: string;
  synthesisAmount: string;
  workupAmount: string;
  elnLink: string;
  bet: AnalysisState;
  xrd: AnalysisState;
  sem: AnalysisState;
  status: ExperimentStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'active' | 'archive';
