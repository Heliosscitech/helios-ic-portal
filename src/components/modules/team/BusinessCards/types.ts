export interface ContactInfo {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  tags: string[];
  type: 'customer' | 'investor' | 'academic' | 'supplier' | 'other';
}

export type ContactFormData = Omit<ContactInfo, 'id'>;
