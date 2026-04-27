import {
  FlaskConical,
  Package,
  Wrench,
  AlertTriangle,
  FileText,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type { PurchaseStatus, PurchaseType, StatusTab, StorageKind, Urgency } from './types';

export const PERSISTENCE_KEY = 'helios:satin-alma:requests:v2';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface TypeMeta {
  label: string;
  icon: LucideIcon;
  badge: string; // background pill
  badgeText: string; // pill text color
  border: string; // left-border color class for cards
}

export const TYPE_META: Record<PurchaseType, TypeMeta> = {
  kimyasal: {
    label: 'Kimyasal',
    icon: FlaskConical,
    badge: 'bg-purple-bg',
    badgeText: 'text-purple-text',
    border: 'border-l-[#3C3489]',
  },
  sarf: {
    label: 'Sarf / ofis',
    icon: Package,
    badge: 'bg-teal-bg',
    badgeText: 'text-teal-text',
    border: 'border-l-[#0F6E56]',
  },
  ekipman: {
    label: 'Ekipman',
    icon: Wrench,
    badge: 'bg-amber-bg',
    badgeText: 'text-amber-text',
    border: 'border-l-[#BA7517]',
  },
  ariza: {
    label: 'Arıza / kırık',
    icon: AlertTriangle,
    badge: 'bg-red-bg',
    badgeText: 'text-red-text',
    border: 'border-l-red-border',
  },
  hizmet: {
    label: 'Hizmet / ödeme',
    icon: FileText,
    badge: 'bg-info-bg',
    badgeText: 'text-info-text',
    border: 'border-l-info-border',
  },
  diger: {
    label: 'Diğer',
    icon: MoreHorizontal,
    badge: 'bg-surface-2',
    badgeText: 'text-text-2',
    border: 'border-l-border-strong',
  },
};

export const TYPE_ORDER: PurchaseType[] = ['kimyasal', 'sarf', 'ekipman', 'ariza', 'hizmet', 'diger'];

interface StatusMeta {
  label: string;
  pill: string; // pill background + text
}

export const STATUS_META: Record<PurchaseStatus, StatusMeta> = {
  'yeni': {
    label: 'Yeni',
    pill: 'bg-info-bg text-info-text',
  },
  'siparis-verildi': {
    label: 'Sipariş verildi',
    pill: 'bg-purple-bg text-purple-text',
  },
  'geldi': {
    label: 'Geldi',
    pill: 'bg-teal-bg text-teal-text',
  },
  'iptal-iade': {
    label: 'İptal / İade',
    pill: 'bg-red-bg text-red-text',
  },
};

export const STATUS_ORDER: PurchaseStatus[] = ['yeni', 'siparis-verildi', 'geldi', 'iptal-iade'];

export const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'aktif', label: 'Aktif' },
  { id: 'yeni', label: 'Yeni' },
  { id: 'siparis-verildi', label: 'Sipariş verildi' },
  { id: 'geldi', label: 'Geldi' },
  { id: 'iptal-iade', label: 'İptal / İade' },
];

export const URGENCY_LABEL: Record<Urgency, string> = {
  normal: 'Normal',
  yuksek: 'Yüksek',
  acil: 'Acil',
};

export const STORAGE_LABEL: Record<Exclude<StorageKind, ''>, string> = {
  oda: 'Oda sıcaklığı',
  '4c': '+4 °C',
  '-20c': '-20 °C',
  '-80c': '-80 °C',
  yanici: 'Yanıcı kabin',
};
