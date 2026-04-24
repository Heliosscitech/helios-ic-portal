export type WPStatus = 'bekliyor' | 'devam' | 'tamam';
export type ProjectStatus = 'aktif' | 'tamamlandi' | 'duraklatildi';

export interface WorkPackage {
  id: string;
  title: string;
  status: WPStatus;
  deadline: string;
  notes: string;
}

export interface ReportPeriod {
  id: string;
  title: string;
  date: string;
  status: WPStatus;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  color: string;
  startDate: string;
  endDate: string;
  leaderId: string;
  memberIds: string[];
  budgetK: number;
  spentK: number;
  status: ProjectStatus;
  workPackages: WorkPackage[];
  reportPeriods: ReportPeriod[];
  notes: string;
}

export interface NewProjectFormData {
  name: string;
  subtitle: string;
  code: string;
  budgetK: number;
  leaderId: string;
  memberIds: string[];
  startDate: string;
  endDate: string;
}
