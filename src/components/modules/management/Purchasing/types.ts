export type PurchaseType = 'kimyasal' | 'sarf' | 'ekipman' | 'ariza' | 'hizmet' | 'diger';

export type PurchaseStatus = 'yeni' | 'siparis-verildi' | 'geldi' | 'iptal-iade';

export type Urgency = 'normal' | 'yuksek' | 'acil';

export type StorageKind = '' | 'oda' | '4c' | '-20c' | '-80c' | 'yanici';

export interface PurchaseAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export type PurchaseDetails =
  | { kind: 'kimyasal'; cas?: string; purity?: string; manufacturer?: string; storage?: StorageKind }
  | { kind: 'sarf'; brandModel?: string; supplier?: string }
  | { kind: 'ekipman'; brandModel?: string; supplier?: string; warrantyMonths?: string }
  | { kind: 'ariza'; device?: string; detectedAt?: string; faultType?: string }
  | { kind: 'hizmet'; serviceType?: string; company?: string; invoiceNo?: string; invoiceDate?: string }
  | { kind: 'diger' };

export interface PurchaseAuthor {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface PurchaseRequest {
  id: string;
  type: PurchaseType;
  title: string;
  description: string;
  link?: string;
  estimatedPrice?: string;
  urgency: Urgency;
  quantity?: string;
  attachment?: PurchaseAttachment;
  status: PurchaseStatus;
  createdBy: PurchaseAuthor;
  createdAt: string;
  assignedTo?: PurchaseAuthor;
  details?: PurchaseDetails;
}

export type StatusTab = 'aktif' | PurchaseStatus;
