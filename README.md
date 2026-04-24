# ☀️ Helios İç Portal

Helios Bilim ve Teknoloji A.Ş. için özel olarak geliştirilmiş, şirket içi süreçlerin (Laboratuvar, İK, Finans ve Ekip İşbirliği) tek bir noktadan yönetilmesini sağlayan modern, modüler ve yüksek performanslı iç portal uygulaması.

---

## 🚀 Temel Özellikler

Portal, 18 farklı modül ile tüm departmanların ihtiyaçlarını karşılayacak şekilde tasarlanmıştır:

### 🧪 Laboratuvar Yönetimi
- **Lab Checklist:** Günlük laboratuvar operasyonlarının takibi ve raporlanması.
- **Lab Book & Stok:** Dijital laboratuvar defteri ve sarf malzeme takibi.
- **SOP / Prosedür:** Standart operasyon prosedürlerine hızlı erişim.

### 👥 İnsan Kaynakları
- **İzin / Mazeret:** Dijital izin talebi ve telafi süreçleri.
- **Onboarding:** Yeni ekip üyeleri için oryantasyon süreci takibi.

### 📊 Yönetim ve Finans
- **Satın Alma:** Onay mekanizmalı satın alma talepleri.
- **Ön Muhasebe & Satış:** Temel finansal verilerin takibi.
- **Runway & Projeler:** Nakit akışı ve proje ilerleme durumları.

### 🤝 Ekip İşbirliği
- **Takvim:** Şirket içi etkinlik ve deadline takibi.
- **Görev Panosu (Kanban):** Agile metodolojisine uygun görev yönetimi.
- **Kartvizitler:** Ekip üyeleri ve distribütör iletişim bilgileri.

---

## 🛠️ Teknoloji Yığını

- **Core:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **Animations:** Framer Motion
- **State Management:** React Hooks (Stateful Modüller)

---

## 📂 Klasör Yapısı

Uygulama, ölçeklenebilir bir mimari için kategorize edilmiş modül yapısını kullanır:

```bash
src/
 ├── components/
 │    ├── layout/       # Ortak sayfa yapısı (Sidebar, Header)
 │    ├── modules/      # Uygulama modülleri
 │    │    ├── lab/         # Laboratuvar araçları
 │    │    ├── hr/          # İnsan kaynakları araçları
 │    │    ├── team/        # Ekip içi araçlar
 │    │    └── management/  # Finansal ve yönetsel araçlar
 │    └── ui/           # Temel UI bileşenleri
 ├── types/             # TypeScript tip tanımlamaları
 └── lib/               # Yardımcı fonksiyonlar (Utility belt)
```

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Üretim paketi oluşturun:
```bash
npm run build
```

---

## 📜 Lisans

© 2026 Helios Bilim ve Teknoloji A.Ş. Tüm hakları saklıdır.
