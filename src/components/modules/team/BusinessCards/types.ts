export interface ContactInfo {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  tags: string[];
  type: 'customer' | 'investor' | 'academic' | 'supplier' | 'other';
  neredeTanistiniz?: string;
  tarih?: string; // ISO 'YYYY-MM-DD'
  not?: string;
}

export type ContactFormData = Omit<ContactInfo, 'id'>;
