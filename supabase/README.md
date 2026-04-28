# Helios İç Portal — Supabase

Bu klasör Helios İç Portal'ın Supabase backend tanımlarını içerir.

## Dosyalar

- `migrations/0001_init.sql` — tüm tablolar, enum'lar, trigger'lar, index'ler, RLS politikaları ve realtime publication tanımı.
- `seed.sql` — sabit referans veriler (lab cihazları, onboarding şablonları) ve `PORTAL_USERS` için yorum satırlı örnek insert'ler.

## Kurulum (yeni Supabase projesinde)

1. Supabase Studio → SQL Editor → `migrations/0001_init.sql` içeriğini yapıştır ve çalıştır.
2. Authentication → Users panelinden 7 portal kullanıcısını (Gizem U., Gizem Ş., İlker, Melike, Busenur, Mert, İrem) email/password ile oluştur.
3. Her kullanıcının `auth.users.id` değerini `seed.sql` içindeki yorumlu insert satırlarındaki placeholder uuid'lerle değiştirip çalıştır.
4. `seed.sql` içindeki sabit referans verilerin (lab_devices, onboarding_phase_templates) yorumsuz kısmını çalıştır.
5. Storage → yeni bucket'lar oluştur (private):
   - `leave-documents`
   - `purchase-attachments`
   - `press-media`

## Tipler (frontend için)

Migration sonrası TypeScript tipleri üret:

```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```

## Stub modüller (henüz şemada yok)

- `lab-book` (Elektronik Lab Defteri)
- `lab-stok` (Lab stok takibi)
- `sop-prosedur` (SOP dökümanları)
- `on-muhasebe` (Ön muhasebe)
- `satis` (Satış pipeline)
- `runway` (Nakit projeksiyon)

Tipi netleşince ayrı migration (`0002_*.sql`) ile eklenecek.

## Realtime

Yalnızca `notifications` ve `notification_targets` tabloları realtime publication'a eklendi. Diğer tablolar fetch-based çalışır.

## RLS Modeli

- **Auth olan herkes okur** — tüm modüller giriş yapmış kullanıcılara açık (istisna: `leave_requests` sadece sahip + manager + yönetici).
- **Yönetici (`user_role = 'yonetici'`)** — her tabloda full CRUD.
- **Sahip / oluşturan / atanan** — kendi kayıtlarını günceller.
- **Purchasing responsibility** — `purchase_requests` üzerinde tam yetki.
