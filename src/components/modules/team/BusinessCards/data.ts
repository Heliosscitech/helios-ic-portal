import type { ContactInfo } from './types';

export const INITIAL_CONTACTS: ContactInfo[] = [
  {
    id: 'C1',
    name: 'Ayşe Kaya',
    title: 'Yatırım Direktörü',
    company: 'Global Ventures',
    email: 'ayse.kaya@globalv.com',
    phone: '+90 532 111 22 33',
    tags: ['Yatırımcı', 'Fintek'],
    type: 'investor',
  },
  {
    id: 'C2',
    name: 'Dr. Mehmet Öz',
    title: 'Bölüm Başkanı',
    company: 'Teknik Üniversite',
    email: 'moz@itu.edu.tr',
    phone: '+90 212 444 00 00',
    tags: ['Akademik', 'Güneş Enerjisi'],
    type: 'academic',
  },
  {
    id: 'C3',
    name: 'Can Tekin',
    title: 'Satın Alma Müdürü',
    company: 'Endüstri A.Ş.',
    email: 'can@industri.com',
    phone: '+90 555 999 88 77',
    tags: ['Müşteri', 'Lojistik'],
    type: 'customer',
  },
];
