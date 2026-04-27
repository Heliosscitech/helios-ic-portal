export type DistributorRegion =
  | 'avrupa'
  | 'kuzey-amerika'
  | 'guney-amerika'
  | 'asya-pasifik'
  | 'orta-dogu-kafrika'
  | 'sahra-alti-afrika'
  | 'okyanusya';

export type DistributorStatus =
  | 'arastirilacak'
  | 'mail-atildi'
  | 'follow-up'
  | 'gorusme-planlandi'
  | 'numune-gonderildi'
  | 'teklif-hazirlandi'
  | 'sozlesme-imzalandi'
  | 'pasif';

export type FollowUpStep =
  | 'ilk-mail'
  | 'fu-1'
  | 'fu-2'
  | 'meet'
  | 'toplanti'
  | 'numune'
  | 'teklif'
  | 'sozlesme';

export interface DistributorContact {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export type StepMap = Record<FollowUpStep, boolean>;

export interface Distributor {
  id: string;
  region: DistributorRegion;
  country: string;
  name: string;
  website: string;
  expertise: string;
  contact1: DistributorContact;
  contact2: DistributorContact;
  steps: StepMap;
  status: DistributorStatus;
  ownerId: string | null;
  nextStep: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
