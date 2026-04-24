import type { BoardTask } from './types';

export const CURRENT_USER_ID = 'u1';

export const BOARD_TASKS: BoardTask[] = [
  // ----- Ar-Ge (6) -----
  { id: 'T-01', title: 'CALF-20 scale-up deney tasarımı', description: 'Pilot ölçekli reaksiyon için parametre matrisinin hazırlanması.', unitId: 'arge', status: 'doing', priority: 'high', dueDate: '2026-04-24', assigneeIds: ['u3'], creatorId: 'u1', tags: ['Sentez', 'Acil'], comments: 4 },
  { id: 'T-02', title: 'Yeni katalizör sentez protokolü', description: 'Literatür taraması ve sentez yolunun netleştirilmesi.', unitId: 'arge', status: 'todo', priority: 'medium', dueDate: '2026-04-26', assigneeIds: ['u3'], creatorId: 'u1', tags: ['Sentez'], comments: 2 },
  { id: 'T-03', title: 'XRD analizi sonuçlarının raporlanması', description: 'Son numunelerin karakterizasyon raporu.', unitId: 'arge', status: 'done', priority: 'low', dueDate: '2026-04-19', assigneeIds: ['u4'], creatorId: 'u1', tags: ['Karakterizasyon', 'Rapor'], comments: 1 },
  { id: 'T-04', title: 'BET yüzey alanı ölçüm planı', description: 'Teknopark ortak laboratuvarı ile slot ayarlanması.', unitId: 'arge', status: 'doing', priority: 'medium', dueDate: '2026-04-25', assigneeIds: ['u3'], creatorId: 'u1', tags: ['Karakterizasyon'], comments: 0 },
  { id: 'T-05', title: 'Hibe teknik ek (EK-1) hazırlığı', description: 'TÜBİTAK 1501 için teknik dokümanların revizyonu.', unitId: 'arge', status: 'todo', priority: 'high', dueDate: '2026-04-27', assigneeIds: ['u1'], creatorId: 'u1', tags: ['Hibe', 'TÜBİTAK'], comments: 3 },
  { id: 'T-06', title: 'Patent literatür taraması', description: 'Alternatif sentez yollarının patent taraması.', unitId: 'arge', status: 'done', priority: 'low', dueDate: '2026-04-18', assigneeIds: ['u2'], creatorId: 'u1', tags: ['Patent', 'Araştırma'], comments: 0 },

  // ----- İş Geliştirme (6) -----
  { id: 'T-07', title: 'Aluminum firması toplantı hazırlığı', description: 'Görüşme öncesi teknik fit değerlendirmesi.', unitId: 'is-gelistirme', status: 'doing', priority: 'high', dueDate: '2026-04-29', assigneeIds: ['u1'], creatorId: 'u1', tags: ['Müşteri'], comments: 5 },
  { id: 'T-08', title: 'Yatırımcı sunumu güncellemesi', description: 'Seed round deck v3.2 revizyonu.', unitId: 'is-gelistirme', status: 'todo', priority: 'high', dueDate: '2026-04-30', assigneeIds: ['u1'], creatorId: 'u1', tags: ['Yatırımcı'], comments: 2 },
  { id: 'T-09', title: 'Teknopark dönem raporu', description: 'Q1 2026 dönem raporu teslimi.', unitId: 'is-gelistirme', status: 'done', priority: 'medium', dueDate: '2026-04-15', assigneeIds: ['u5'], creatorId: 'u1', tags: ['Rapor', 'Teknopark'], comments: 1 },
  { id: 'T-10', title: 'NDA taslağı — Distribütör X', description: 'Hukuk ekibiyle taslak üzerinde revizyon.', unitId: 'is-gelistirme', status: 'done', priority: 'medium', dueDate: '2026-04-20', assigneeIds: ['u5'], creatorId: 'u1', tags: ['Hukuk', 'Distribütör'], comments: 2 },
  { id: 'T-11', title: 'Hibe ön başvuru formu', description: 'Horizon Europe için ön başvuru hazırlığı.', unitId: 'is-gelistirme', status: 'done', priority: 'low', dueDate: '2026-04-14', assigneeIds: ['u1'], creatorId: 'u1', tags: ['Hibe', 'AB'], comments: 0 },
  { id: 'T-12', title: 'Pazar araştırması — Avrupa', description: 'Hedef müşteri segmenti haritalaması.', unitId: 'is-gelistirme', status: 'todo', priority: 'medium', dueDate: '2026-05-02', assigneeIds: ['u2'], creatorId: 'u1', tags: ['Pazar', 'Araştırma'], comments: 1 },

  // ----- Üretim (5) -----
  { id: 'T-13', title: 'Pilot reaktör bakım takvimi', description: 'Yıllık bakım planının netleştirilmesi.', unitId: 'uretim', status: 'doing', priority: 'medium', dueDate: '2026-04-24', assigneeIds: ['u4'], creatorId: 'u4', tags: ['Bakım'], comments: 1 },
  { id: 'T-14', title: 'Reaktör conta siparişi', description: 'Yedek conta setinin tedariki.', unitId: 'uretim', status: 'done', priority: 'low', dueDate: '2026-04-17', assigneeIds: ['u3'], creatorId: 'u1', tags: ['Satın alma'], comments: 0 },
  { id: 'T-15', title: 'Üretim SOP revizyonu', description: 'CALF-20 üretim prosedürü v2.', unitId: 'uretim', status: 'done', priority: 'medium', dueDate: '2026-04-21', assigneeIds: ['u4'], creatorId: 'u4', tags: ['SOP'], comments: 3 },
  { id: 'T-16', title: 'Ekipman validasyonu', description: 'Yeni karıştırıcının validasyon testleri.', unitId: 'uretim', status: 'done', priority: 'low', dueDate: '2026-04-16', assigneeIds: ['u3'], creatorId: 'u1', tags: ['Validasyon'], comments: 0 },
  { id: 'T-17', title: 'Ham madde stok sayımı', description: 'Aylık fiziksel sayım ve sistem sarf raporu.', unitId: 'uretim', status: 'todo', priority: 'medium', dueDate: '2026-04-28', assigneeIds: ['u5'], creatorId: 'u1', tags: ['Stok'], comments: 0 },

  // ----- Satış (3) -----
  { id: 'T-18', title: 'Distribütör tekliflerinin derlenmesi', description: 'Q2 teklif listesinin tek dosyada toplanması.', unitId: 'satis', status: 'doing', priority: 'high', dueDate: '2026-04-25', assigneeIds: ['u5'], creatorId: 'u1', tags: ['Teklif'], comments: 2 },
  { id: 'T-19', title: 'Avrupa distribütör follow-up', description: 'Pending cevap bekleyen 4 firmaya hatırlatma.', unitId: 'satis', status: 'done', priority: 'medium', dueDate: '2026-04-22', assigneeIds: ['u5'], creatorId: 'u5', tags: ['Distribütör'], comments: 1 },
  { id: 'T-20', title: 'CRM giriş güncellemesi', description: 'Yeni kontak ve görüşme notlarının girilmesi.', unitId: 'satis', status: 'done', priority: 'low', dueDate: '2026-04-20', assigneeIds: ['u1'], creatorId: 'u1', tags: ['CRM'], comments: 0 },

  // ----- İdari (6) -----
  { id: 'T-21', title: 'Nisan ayı bordro hazırlığı', description: 'Muhasebe ile bordro dosyasının netleştirilmesi.', unitId: 'idari', status: 'doing', priority: 'high', dueDate: '2026-04-28', assigneeIds: ['u5'], creatorId: 'u5', tags: ['Finans', 'İK'], comments: 2 },
  { id: 'T-22', title: 'Ofis sarf malzeme siparişi', description: 'Aylık ofis sarf tedarik siparişi.', unitId: 'idari', status: 'doing', priority: 'low', dueDate: '2026-04-23', assigneeIds: ['u5'], creatorId: 'u1', tags: ['Ofis'], comments: 0 },
  { id: 'T-23', title: 'Kurumsal sigorta yenileme', description: 'İş yeri sigortasının yenileme süreci.', unitId: 'idari', status: 'todo', priority: 'medium', dueDate: '2026-05-05', assigneeIds: ['u1'], creatorId: 'u1', tags: ['Sigorta'], comments: 1 },
  { id: 'T-24', title: 'Onboarding dokümanları güncelleme', description: 'Yeni başlayanlar için el kitapçığı revizyonu.', unitId: 'idari', status: 'todo', priority: 'low', dueDate: '2026-05-03', assigneeIds: ['u1'], creatorId: 'u1', tags: ['İK'], comments: 0 },
  { id: 'T-25', title: 'Muhasebe kapanış kontrolü', description: 'Nisan ay sonu kapanış mutabakatı.', unitId: 'idari', status: 'done', priority: 'medium', dueDate: '2026-04-30', assigneeIds: ['u4'], creatorId: 'u1', tags: ['Finans'], comments: 0 },
  { id: 'T-26', title: 'Araç filosu ruhsat takibi', description: 'Ruhsat süresi yaklaşan araçların takibi.', unitId: 'idari', status: 'done', priority: 'low', dueDate: '2026-04-19', assigneeIds: ['u6'], creatorId: 'u1', tags: ['Lojistik'], comments: 0 },
];
