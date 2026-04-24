import type { LucideIcon } from 'lucide-react';
import { Activity, Users as UsersIcon, Building2, GraduationCap, Bus, Edit3 } from 'lucide-react';

export type LeaveReasonId = 'saglik' | 'aile' | 'resmi' | 'egitim' | 'ulasim' | 'diger';

export interface LeaveReason {
  id: LeaveReasonId;
  label: string;
  icon: LucideIcon;
}

export interface Department {
  id: string;
  label: string;
}

export const DEPARTMENTS: Department[] = [
  { id: 'arge', label: 'Ar-Ge' },
  { id: 'is-gelistirme', label: 'İş Geliştirme' },
  { id: 'operasyon', label: 'Operasyon' },
];

export const REASONS: LeaveReason[] = [
  { id: 'saglik', label: 'Sağlık / hastalık', icon: Activity },
  { id: 'aile', label: 'Aile acil durumu', icon: UsersIcon },
  { id: 'resmi', label: 'Resmi işlem', icon: Building2 },
  { id: 'egitim', label: 'Eğitim / kurs', icon: GraduationCap },
  { id: 'ulasim', label: 'Ulaşım sorunu', icon: Bus },
  { id: 'diger', label: 'Diğer', icon: Edit3 },
];

export type BelgeDurumu = 'Sonradan getireceğim' | 'Ekledim' | 'Gerekli değil';

export interface LeaveFormState {
  employeeId: string;
  departman: string;
  managerId: string; // user.id
  email: string;
  rangeStart: number;
  rangeEnd: number;
  reason: LeaveReasonId;
  reasonDetail: string;
  belge: BelgeDurumu;
  belgeFileName?: string;
  belgeFileDataUrl?: string;
  telafiNotu: string;
  telafiGunleri: number[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  departman: string;
  managerId: string;
  email: string;
  rangeStart: number;
  rangeEnd: number;
  reason: LeaveReasonId;
  reasonDetail: string;
  belge: BelgeDurumu;
  belgeFileName?: string;
  belgeFileDataUrl?: string;
  telafiNotu: string;
  telafiGunleri: number[];
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNote?: string;
  reviewedAt?: number;
}
