import type { OnboardingPerson, OnboardingTemplate, PersonPhase } from './types';

export const DEFAULT_TEMPLATE: OnboardingTemplate = [
  {
    id: 'phase-1',
    title: '1. Gün — İlk temas',
    tasks: [
      {
        id: 'tpl-1-1',
        title: 'Lab turu & güvenlik oryantasyonu',
        description: 'Tüm lab alanları, acil çıkış, göz duşu, kimyasal raf yerleşimi',
        assignee: 'İlker / Melike',
      },
      {
        id: 'tpl-1-2',
        title: 'Ekip tanıştırması',
        description: 'Tüm ekip üyeleri, rol ve sorumluluklar',
        assignee: 'Gizem',
      },
      {
        id: 'tpl-1-3',
        title: 'E-posta hesabı & Slack aktif',
        description: '@heliosscitech.com maili, Slack workspace davet',
        assignee: 'Mert',
      },
      {
        id: 'tpl-1-4',
        title: 'Dashboard & Drive erişimi',
        description: 'İç işler portalı + shared drive klasörleri',
        assignee: 'Mert',
      },
    ],
  },
  {
    id: 'phase-2',
    title: '1. Hafta — Temel eğitim',
    tasks: [
      {
        id: 'tpl-2-1',
        title: 'Kimyasal güvenlik eğitimi',
        description: 'MSDS okuma, CO₂ monitör kullanımı, eldiven/gözlük standartları',
        assignee: 'İlker',
      },
      {
        id: 'tpl-2-2',
        title: 'ELN (Lab book) kullanımı',
        description: 'Yeni deney kaydetme, drive link ekleme, prosedür formatı',
        assignee: 'Melike',
      },
      {
        id: 'tpl-2-3',
        title: 'Temel MOF eğitimi — CALF-20, UiO-66',
        description: 'Sentez mantığı, kristal yapı, tipik karakterizasyonlar',
        assignee: 'Gizem',
      },
      {
        id: 'tpl-2-4',
        title: 'İşler modülü & haftalık sync',
        description: "Pazartesi 10:00 haftalık sync toplantısı",
        assignee: 'Gizem',
      },
    ],
  },
  {
    id: 'phase-3',
    title: '1. Ay — Bağımsız çalışma',
    tasks: [
      {
        id: 'tpl-3-1',
        title: 'İlk bağımsız deney',
        description: 'Önceden yapılmış bir deneyi tekrar et — sonuçları kıyasla',
        assignee: 'İlker',
      },
      {
        id: 'tpl-3-2',
        title: 'Cihaz sertifikasyonu — BET',
        description: 'Micromeritics BET cihazı sertifikası (numune hazırlama → analiz → rapor)',
        assignee: 'Melike',
      },
      {
        id: 'tpl-3-3',
        title: 'Kalite kontrol prosedürü',
        description: 'Ürün sevkiyatı öncesi QC checklist',
        assignee: 'İlker',
      },
      {
        id: 'tpl-3-4',
        title: 'Confluence / Notion dokümanları',
        description: "İlgili SOP'ları oku, soru oluştur",
        assignee: 'Gizem',
      },
    ],
  },
  {
    id: 'phase-4',
    title: 'İdari & Sözleşmeler',
    tasks: [
      {
        id: 'tpl-4-1',
        title: 'İş sözleşmesi imza',
        description: 'İnsan kaynakları evrakları',
        assignee: 'Buse',
      },
      {
        id: 'tpl-4-2',
        title: 'KVKK & NDA imza',
        description: 'Kişisel veri ve gizlilik',
        assignee: 'Buse',
      },
      {
        id: 'tpl-4-3',
        title: 'Telefon, kartvizit, maske',
        description: 'Şirket telefonu, N95 maske, kartvizit siparişi',
        assignee: 'Buse',
      },
      {
        id: 'tpl-4-4',
        title: 'Banka hesabı & SGK kaydı',
        description: 'Maaş ödemesi için',
        assignee: 'Buse',
      },
    ],
  },
];

// Seed kişileri oluştur — görseldeki iki kişi
const buildSeedPhases = (doneUpTo: number): PersonPhase[] => {
  let count = 0;
  return DEFAULT_TEMPLATE.map((phase, pIdx) => ({
    id: `seed-p${pIdx}-${phase.id}`,
    title: phase.title,
    tasks: phase.tasks.map((t, tIdx) => {
      const index = count++;
      return {
        id: `seed-t${pIdx}-${tIdx}-${t.id}`,
        title: t.title,
        description: t.description,
        assignee: t.assignee,
        isDone: index < doneUpTo,
      };
    }),
  }));
};

export const SEED_PEOPLE: OnboardingPerson[] = [
  {
    id: 'person-mert',
    name: 'Mert Demir',
    role: 'Developer Stajyeri',
    startDate: '2026-03-15',
    ownerId: 'u6', // Mert Üper hesabı bu kaydı kendi onboarding'i olarak görür
    phases: buildSeedPhases(16), // 16/16
  },
  {
    id: 'person-irem',
    name: 'İrem Rabia',
    role: 'Lab asistanı',
    startDate: '2026-02-10',
    ownerId: 'u7', // İrem Rabia hesabı bu kaydı kendi onboarding'i olarak görür
    phases: buildSeedPhases(12), // 12/16
  },
];
