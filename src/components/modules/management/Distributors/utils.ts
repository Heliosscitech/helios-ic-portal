import { EMPTY_STEPS } from './constants';
import type { Distributor, DistributorContact, DistributorRegion, DistributorStatus } from './types';

export const generateId = (): string =>
  `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const emptyContact = (): DistributorContact => ({
  name: '',
  title: '',
  email: '',
  phone: '',
});

export const createDistributor = (region: DistributorRegion, country: string): Distributor => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    region,
    country,
    name: '',
    website: '',
    expertise: '',
    contacts: [emptyContact()],
    steps: { ...EMPTY_STEPS },
    status: 'arastirilacak',
    ownerId: null,
    nextStep: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
};

export interface Stats {
  total: number;           // toplam kayıt
  research: number;        // 'arastirilacak'
  mailSent: number;        // 'mail-atildi' + 'follow-up'
  sample: number;          // 'numune-gonderildi'
  contract: number;        // 'sozlesme-imzalandi'
  passive: number;         // 'pasif'
}

export const computeStats = (distributors: Distributor[]): Stats => {
  let research = 0, mailSent = 0, sample = 0, contract = 0, passive = 0;
  for (const d of distributors) {
    switch (d.status) {
      case 'arastirilacak':
        research += 1; break;
      case 'mail-atildi':
      case 'follow-up':
        mailSent += 1; break;
      case 'numune-gonderildi':
        sample += 1; break;
      case 'sozlesme-imzalandi':
        contract += 1; break;
      case 'pasif':
        passive += 1; break;
    }
  }
  return { total: distributors.length, research, mailSent, sample, contract, passive };
};

export interface FilterArgs {
  search: string;
  status: DistributorStatus | 'all';
  ownerId: string | 'all' | 'unassigned';
}

// Türkçe karakterleri ASCII karşılığına indirger ve küçük harfe çevirir.
// Böylece "türkiye"/"turkiye", "İstanbul"/"istanbul" gibi aramalar eşleşir.
export const foldTr = (s: string): string =>
  s
    .replace(/[İIı]/g, 'i')
    .replace(/[Şş]/g, 's')
    .replace(/[Ğğ]/g, 'g')
    .replace(/[Üü]/g, 'u')
    .replace(/[Öö]/g, 'o')
    .replace(/[Çç]/g, 'c')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export const filterDistributors = (list: Distributor[], { search, status, ownerId }: FilterArgs): Distributor[] => {
  const q = foldTr(search.trim());
  return list.filter((d) => {
    if (status !== 'all' && d.status !== status) return false;
    if (ownerId === 'unassigned' && d.ownerId !== null) return false;
    if (ownerId !== 'all' && ownerId !== 'unassigned' && d.ownerId !== ownerId) return false;
    if (q) {
      const contactNames = d.contacts.map((c) => `${c.name} ${c.title} ${c.email}`).join(' ');
      const hay = foldTr(`${d.name} ${d.country} ${d.expertise} ${d.notes} ${contactNames}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
};
