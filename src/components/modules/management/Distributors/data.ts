import { EMPTY_STEPS } from './constants';
import type { Distributor } from './types';

export const INITIAL_DISTRIBUTORS: Distributor[] = [
  {
    id: 'd-seed-001',
    region: 'avrupa',
    country: 'Türkiye',
    name: 'Bioneva',
    website: 'www.bioneva.com.tr',
    expertise: 'MOF / Kimyasal Hammadde / Katalizör',
    contacts: [{ name: '', title: '', email: '', phone: '' }],
    steps: { ...EMPTY_STEPS, 'ilk-mail': true, 'fu-1': true },
    status: 'follow-up',
    ownerId: 'u5',
    nextStep: 'Website inceleme ve ilk iletişim bilgisi araştırması',
    notes: '',
    createdAt: '2026-04-20T09:00:00.000Z',
    updatedAt: '2026-04-25T14:30:00.000Z',
  },
  {
    id: 'd-seed-002',
    region: 'avrupa',
    country: 'Türkiye',
    name: 'Boga Kimya',
    website: '',
    expertise: 'Kimyasal Hammadde / Katalizör',
    contacts: [{ name: '', title: '', email: '', phone: '' }],
    steps: { ...EMPTY_STEPS },
    status: 'arastirilacak',
    ownerId: 'u5',
    nextStep: '',
    notes: '',
    createdAt: '2026-04-21T10:00:00.000Z',
    updatedAt: '2026-04-21T10:00:00.000Z',
  },
];
