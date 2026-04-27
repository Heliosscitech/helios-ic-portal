import type { ModuleId, User } from './portal';

export const ALL_MODULE_IDS: ModuleId[] = [
  'pano', 'takvim', 'lab-checklist', 'izin-mazeret', 'lab-book',
  'satin-alma', 'board', 'on-muhasebe', 'satis', 'projeler',
  'kartvizitler', 'onboarding', 'basin', 'sop-prosedur', 'runway',
  'arge-plani', 'lab-stok', 'distributor', 'kullanicilar',
];

export const DEFAULT_CALISAN_MODULES: ModuleId[] = [
  'pano', 'takvim', 'board', 'lab-checklist', 'lab-book',
  'lab-stok', 'sop-prosedur', 'izin-mazeret', 'kartvizitler',
];

export const PORTAL_USERS: User[] = [
  {
    id: 'u1', name: 'Gizem Uysal', initials: 'GU',
    role: 'Kurucu Ortak', color: 'bg-indigo-100 text-indigo-700',
    userRole: 'yonetici', allowedModules: ALL_MODULE_IDS,
    responsibilities: ['purchasing'],
  },
  {
    id: 'u2', name: 'Gizem Şanyılmaz', initials: 'GŞ',
    role: 'Ar-Ge Uzmanı', color: 'bg-purple-100 text-purple-700',
    userRole: 'calisan', allowedModules: DEFAULT_CALISAN_MODULES,
    responsibilities: [],
  },
  {
    id: 'u3', name: 'İlker Deveci', initials: 'İD',
    role: 'Ar-Ge Uzmanı', color: 'bg-emerald-100 text-emerald-700',
    userRole: 'calisan', allowedModules: DEFAULT_CALISAN_MODULES,
    responsibilities: [],
  },
  {
    id: 'u4', name: 'Melike Gürkan', initials: 'MG',
    role: 'Ar-Ge Uzmanı', color: 'bg-pink-100 text-pink-700',
    userRole: 'calisan', allowedModules: DEFAULT_CALISAN_MODULES,
    responsibilities: [],
  },
  {
    id: 'u5', name: 'Busenur Kutlu Kara', initials: 'BK',
    role: 'İK & Operasyon', color: 'bg-orange-100 text-orange-700',
    userRole: 'calisan', allowedModules: [...DEFAULT_CALISAN_MODULES, 'onboarding', 'izin-mazeret'],
    responsibilities: [],
  },
  {
    id: 'u6', name: 'Mert Üper', initials: 'MÜ',
    role: 'Kurucu Ortak', color: 'bg-blue-100 text-blue-700',
    userRole: 'calisan', allowedModules: DEFAULT_CALISAN_MODULES,
    responsibilities: [],
  },
  {
    id: 'u7', name: 'İrem Rabia', initials: 'İR',
    role: 'Ar-Ge Uzmanı', color: 'bg-teal-100 text-teal-700',
    userRole: 'calisan', allowedModules: DEFAULT_CALISAN_MODULES,
    responsibilities: [],
  },
];

export const HR_USER_IDS: readonly string[] = ['u1', 'u5'];
export const isHr = (userId: string): boolean => HR_USER_IDS.includes(userId);
