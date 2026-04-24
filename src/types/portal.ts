export type UserRole = 'yonetici' | 'calisan';

export type ModuleId =
  | 'pano'
  | 'takvim'
  | 'lab-checklist'
  | 'izin-mazeret'
  | 'lab-book'
  | 'satin-alma'
  | 'board'
  | 'on-muhasebe'
  | 'satis'
  | 'projeler'
  | 'kartvizitler'
  | 'onboarding'
  | 'basin'
  | 'sop-prosedur'
  | 'runway'
  | 'arge-plani'
  | 'lab-stok'
  | 'distributor'
  | 'kullanicilar';

export type ModuleConfig = {
  id: ModuleId;
  title: string;
  icon: string;
  color: string;
  badge?: string;
  soon?: boolean;
}

export type User = {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  userRole: UserRole;
  allowedModules: ModuleId[];
}

export type ModuleProps = {
  user: User;
}
