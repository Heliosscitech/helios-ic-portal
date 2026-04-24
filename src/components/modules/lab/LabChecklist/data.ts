import type { ChecklistTabData, ChecklistTabId } from './types';

export const INITIAL_DATA: Record<ChecklistTabId, ChecklistTabData> = {
  haftalik: {
    sorumlu: 'Melike Gürkan',
    items: [
      { id: 'h1', name: 'Etüv', instruction: 'Vakum seviyesi, sıcaklık, conta, temizlik' },
      { id: 'h2', name: 'Vakum Etüv', instruction: 'Vakum seviyesi, sıcaklık, conta, temizlik' },
      { id: 'h3', name: 'Ultrasonik Banyo', instruction: 'Suyunu değiştirin' },
      { id: 'h4', name: 'Terazi', instruction: 'Kalibrasyon ağırlığı ile kontrol' },
      { id: 'h5', name: 'pH Metre', instruction: '3 nokta kalibrasyon (pH 4, 7, 10) — buffer çözeltilerle' },
      { id: 'h6', name: 'Karıştırıcı 1', instruction: 'Devir kontrolü, ısıtma plakası' },
      { id: 'h7', name: 'Karıştırıcı 2', instruction: 'Devir kontrolü, ısıtma plakası' },
      { id: 'h8', name: 'Karıştırıcı 3', instruction: 'Devir kontrolü, ısıtma plakası' },
      { id: 'h9', name: 'Santrifüj', instruction: 'Devir, titreşim, kapak kilidi' },
    ],
  },
  aylik: {
    sorumlu: 'İlker Deveci & Melike Gürkan',
    items: [
      { id: 'a1', name: 'Etüv', instruction: 'Sıcaklık doğruluğu, kapak contası' },
      { id: 'a2', name: 'Vakum Etüv', instruction: 'Vakum seviyesi, sıcaklık, conta, temizlik' },
      { id: 'a3', name: 'Ultrasonik Banyo', instruction: 'Isıtma, zamanlayıcı, su seviyesi' },
      { id: 'a4', name: 'Terazi', instruction: 'Sertifikalı ağırlıkla kalibrasyon' },
      { id: 'a5', name: 'pH Metre', instruction: '3 nokta kalibrasyon (pH 4, 7, 10)' },
      { id: 'a6', name: 'Karıştırıcı 1', instruction: 'Devir kontrolü, ısıtma plakası' },
      { id: 'a7', name: 'Karıştırıcı 2', instruction: 'Devir kontrolü, ısıtma plakası' },
      { id: 'a8', name: 'Karıştırıcı 3', instruction: 'Devir kontrolü, ısıtma plakası' },
      { id: 'a9', name: 'Santrifüj', instruction: 'Devir, titreşim, kapak kilidi' },
    ],
  },
  temizlik: {
    sorumlu: 'Tüm ekip (haftalık)',
    items: [
      { id: 't1', name: 'Terazi', instruction: 'Tartım tablası ve çevresinin temizliği' },
      { id: 't2', name: 'Etüv içi', instruction: 'İç yüzeyler, raflar ve kapı contasının temizliği' },
      { id: 't3', name: 'Vakum Etüv içi', instruction: 'İç yüzeyler ve rafların temizliği' },
      { id: 't4', name: 'Beherler / cam eşya', instruction: 'Yıkama, kurutma ve yerleştirme' },
      { id: 't5', name: 'Ultrasonik banyo', instruction: 'Haznenin boşaltılması ve kurulanması' },
      { id: 't6', name: 'Çeker ocak', instruction: 'Yüzey ve iç camın temizliği' },
      { id: 't7', name: 'Lab tezgahı', instruction: 'Tüm tezgahların temizliği, çöplerin toplanması' },
      { id: 't8', name: 'Sıvı atık kutusu', instruction: 'Doluluk kontrolü, gerekirse boşaltılması' },
      { id: 't9', name: 'Katı atık kutusu', instruction: 'Doluluk kontrolü, gerekirse boşaltılması' },
      { id: 't10', name: 'Lab yer temizliği', instruction: "Süpürme + paspas (Furkan'a — bina temizlikçisi — iletilir)" },
    ],
  },
};
