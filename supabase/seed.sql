-- =====================================================================
-- Helios İç Portal — Seed Data
-- =====================================================================
-- NOT: auth.users kayıtlarını Supabase Auth Admin API ile (veya Studio
-- Authentication panelinden) ayrıca oluşturmak gerekir. Bu seed dosyası
-- yalnızca public.users satırlarını ekler — id'ler önceden auth tarafında
-- yaratılmış olmalı. Geliştirme için aşağıdaki uuid'leri (placeholder)
-- gerçek auth.users.id'leri ile değiştir.
-- =====================================================================

-- Örnek kullanım (Supabase JS admin):
--   await supabase.auth.admin.createUser({ email: 'gizem@helios', password: '...' })
--   sonra dönen user.id ile aşağıdaki insert satırındaki uuid'yi eşle.

-- Aşağıdaki satırlar SADECE legacy_id eşlemesinin nasıl yapılacağını
-- gösterir. Gerçek değerleri uygulama tarafında doldur.


insert into public.users (id, legacy_id, name, initials, role, color, user_role, allowed_modules, responsibilities, email) values
  ('1c4cc317-dc3c-4083-b0af-f13725911d80'::uuid, 'u1', 'Gizem Uysal',        'GU', 'Kurucu Ortak',     'bg-indigo-100 text-indigo-700',  'yonetici',
    array['pano','takvim','lab-checklist','izin-mazeret','lab-book','satin-alma','board','on-muhasebe','satis','projeler','kartvizitler','onboarding','basin','sop-prosedur','runway','arge-plani','lab-stok','distributor','kullanicilar']::module_id[],
    array['purchasing']::responsibility[],
    'gizem.uysal@helios'),

  ('c0020661-3aeb-4762-8985-866ff3e1c87a'::uuid, 'u2', 'Gizem Şanyılmaz',    'GŞ', 'Ar-Ge Uzmanı',     'bg-purple-100 text-purple-700',  'calisan',
    array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
    array[]::responsibility[],
    'gizem.s@helios'),

  ('e57d3379-ca56-469c-97b2-588b34fd7631'::uuid, 'u3', 'İlker Deveci',       'İD', 'Ar-Ge Uzmanı',     'bg-emerald-100 text-emerald-700','calisan',
    array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
    array[]::responsibility[],
    'ilker@helios'),

  ('d4a44ec9-05b5-4ec3-b2c8-9293f79a0fdf'::uuid, 'u4', 'Melike Gürkan',      'MG', 'Ar-Ge Uzmanı',     'bg-pink-100 text-pink-700',      'calisan',
    array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
    array[]::responsibility[],
    'melike@helios'),

  ('2c2030c7-a6eb-44b6-bfa1-9a9a8b733129'::uuid, 'u5', 'Busenur Kutlu Kara', 'BK', 'İK & Operasyon',   'bg-orange-100 text-orange-700',  'calisan',
    array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler','onboarding']::module_id[],
    array[]::responsibility[],
    'busenur@helios'),

  ('5f23d58e-e01a-4ae1-bcf6-41ae61f18ff3'::uuid, 'u6', 'Mert Üper',          'MÜ', 'Kurucu Ortak',     'bg-blue-100 text-blue-700',      'calisan',
    array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
    array[]::responsibility[],
    'mert@helios')


-- ---------------------------------------------------------------------
-- Sabit referans veriler (modül seed'leri her ortamda gerekli olan)
-- ---------------------------------------------------------------------

-- Lab cihazları
insert into public.lab_devices (name) values
  ('Etüv'),
  ('HSM'),
  ('Reflüks'),
  ('Otoklav'),
  ('Ultrasonik'),
  ('Vakum fırın'),
  ('Manyetik karıştırıcı')
on conflict (name) do nothing;

-- Lab checklist sabit item'ları (haftalık / aylık / temizlik) — UI'daki seed'den
-- kopyalanmalı; bu örnek sadece şablonun nasıl olacağını gösterir:
/*
insert into public.checklist_items (tab, name, instruction, is_custom, position) values
  ('haftalik', 'Etüv kontrolü',    'Etüv sıcaklık doğruluğunu test et',  false, 0),
  ('haftalik', 'XRD kalibrasyonu', 'Standart numune ile peak doğrula',   false, 1),
  ...
;
*/

-- Onboarding faz şablonları
insert into public.onboarding_phase_templates (title, position) values
  ('1. Gün — İlk Karşılama', 0),
  ('1. Hafta — Temel Eğitim', 1),
  ('1. Ay — Bağımsız Çalışma', 2),
  ('İdari & Sözleşmeler', 3);
