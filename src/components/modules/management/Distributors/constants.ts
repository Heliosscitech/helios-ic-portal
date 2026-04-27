import {
  Mail,
  Phone,
  Calendar,
  Package,
  FileText,
  ScrollText,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { DistributorRegion, DistributorStatus, FollowUpStep, StepMap } from './types';

export const PERSISTENCE_KEY = 'helios:distributors:v2';

interface RegionMeta {
  label: string;
  countries: string[];
}

export const REGION_CONFIG: Record<DistributorRegion, RegionMeta> = {
  'avrupa': {
    label: 'Avrupa',
    countries: [
      'Türkiye', 'Almanya', 'Fransa', 'İtalya', 'İspanya',
      'Birleşik Krallık', 'Hollanda', 'Belçika', 'İsveç', 'Norveç',
      'Danimarka', 'Polonya', 'Avusturya', 'İsviçre', 'Yunanistan', 'Portekiz',
    ],
  },
  'kuzey-amerika': {
    label: 'Kuzey Amerika',
    countries: ['ABD', 'Kanada', 'Meksika'],
  },
  'guney-amerika': {
    label: 'Güney Amerika',
    countries: ['Brezilya', 'Arjantin', 'Şili', 'Kolombiya'],
  },
  'asya-pasifik': {
    label: 'Asya - Pasifik',
    countries: ['Çin', 'Japonya', 'Güney Kore', 'Hindistan', 'Endonezya', 'Tayland', 'Vietnam', 'Singapur', 'Filipinler'],
  },
  'orta-dogu-kafrika': {
    label: 'Orta Doğu & K.Afrika',
    countries: ['BAE', 'Suudi Arabistan', 'Mısır', 'Fas', 'Tunus', 'Cezayir', 'Katar'],
  },
  'sahra-alti-afrika': {
    label: 'Sahra Altı Afrika',
    countries: ['G.Afrika', 'Nijerya', 'Kenya', 'Etiyopya'],
  },
  'okyanusya': {
    label: 'Okyanusya',
    countries: ['Avustralya', 'Yeni Zelanda'],
  },
};

export const REGION_ORDER: DistributorRegion[] = [
  'avrupa', 'kuzey-amerika', 'guney-amerika', 'asya-pasifik',
  'orta-dogu-kafrika', 'sahra-alti-afrika', 'okyanusya',
];

interface StatusMeta {
  label: string;
  pill: string;
}

export const STATUS_META: Record<DistributorStatus, StatusMeta> = {
  'arastirilacak':       { label: 'Araştırılacak',     pill: 'bg-surface-2 text-text-2' },
  'mail-atildi':         { label: 'Mail atıldı',       pill: 'bg-amber-bg text-amber-text' },
  'follow-up':           { label: 'Follow-up',         pill: 'bg-amber-bg text-amber-text' },
  'gorusme-planlandi':   { label: 'Görüşme planlandı', pill: 'bg-info-bg text-info-text' },
  'numune-gonderildi':   { label: 'Numune gönderildi', pill: 'bg-purple-bg text-purple-text' },
  'teklif-hazirlandi':   { label: 'Teklif hazırlandı', pill: 'bg-purple-bg text-purple-text' },
  'sozlesme-imzalandi':  { label: 'Sözleşme imzalandı', pill: 'bg-teal-bg text-teal-text' },
  'pasif':               { label: 'Pasif',             pill: 'bg-red-bg text-red-text' },
};

export const STATUS_ORDER: DistributorStatus[] = [
  'arastirilacak', 'mail-atildi', 'follow-up', 'gorusme-planlandi',
  'numune-gonderildi', 'teklif-hazirlandi', 'sozlesme-imzalandi', 'pasif',
];

interface StepMeta {
  label: string;
  icon: LucideIcon;
}

export const STEP_META: Record<FollowUpStep, StepMeta> = {
  'ilk-mail': { label: 'İlk mail', icon: Mail },
  'fu-1':     { label: 'FU-1',     icon: Mail },
  'fu-2':     { label: 'FU-2',     icon: Mail },
  'meet':     { label: 'Meet',     icon: Phone },
  'toplanti': { label: 'Toplantı', icon: Calendar },
  'numune':   { label: 'Numune',   icon: Package },
  'teklif':   { label: 'Teklif',   icon: FileText },
  'sozlesme': { label: 'Sözleşme', icon: ScrollText },
};

export const STEP_ORDER: FollowUpStep[] = [
  'ilk-mail', 'fu-1', 'fu-2', 'meet', 'toplanti', 'numune', 'teklif', 'sozlesme',
];

export const EMPTY_STEPS: StepMap = {
  'ilk-mail': false,
  'fu-1': false,
  'fu-2': false,
  'meet': false,
  'toplanti': false,
  'numune': false,
  'teklif': false,
  'sozlesme': false,
};

export const MODULE_ICON = Users;
