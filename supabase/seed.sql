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


insert into public.users (id, legacy_id, name, initials, role, color, user_role, allowed_modules, responsibilities, email)
select (select id from auth.users where email = 'gizem@heliosscitech.com'), 'u1', 'Gizem Uysal', 'GU', 'Kurucu Ortak', 'bg-indigo-100 text-indigo-700', 'yonetici'::user_role,
  array['pano','takvim','lab-checklist','izin-mazeret','lab-book','satin-alma','board','on-muhasebe','satis','projeler','kartvizitler','onboarding','basin','sop-prosedur','runway','arge-plani','lab-stok','distributor','kullanicilar']::module_id[],
  array['purchasing']::responsibility[], 'gizem@heliosscitech.com'
union all
select (select id from auth.users where email = 'gizem.sanyilmaz@heliosscitech.com'), 'u2', 'Gizem Şanyılmaz', 'GŞ', 'Ar-Ge Uzmanı', 'bg-purple-100 text-purple-700', 'calisan'::user_role,
  array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
  array[]::responsibility[], 'gizem.sanyilmaz@heliosscitech.com'
union all
select (select id from auth.users where email = 'ilker@heliosscitech.com'), 'u3', 'İlker Deveci', 'İD', 'Ar-Ge Uzmanı', 'bg-emerald-100 text-emerald-700', 'calisan'::user_role,
  array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
  array[]::responsibility[], 'ilker@heliosscitech.com'
union all
select (select id from auth.users where email = 'melike@heliosscitech.com'), 'u4', 'Melike Gürkan', 'MG', 'Ar-Ge Uzmanı', 'bg-pink-100 text-pink-700', 'calisan'::user_role,
  array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
  array[]::responsibility[], 'melike@heliosscitech.com'
union all
select (select id from auth.users where email = 'busenur@heliosscitech.com'), 'u5', 'Busenur Kutlu Kara', 'BK', 'İK & Operasyon', 'bg-orange-100 text-orange-700', 'calisan'::user_role,
  array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler','onboarding']::module_id[],
  array[]::responsibility[], 'busenur@heliosscitech.com'
union all
select (select id from auth.users where email = 'mert@heliosscitech.com'), 'u6', 'Mert Üper', 'MÜ', 'Kurucu Ortak', 'bg-blue-100 text-blue-700', 'calisan'::user_role,
  array['pano','takvim','board','lab-checklist','lab-book','lab-stok','sop-prosedur','izin-mazeret','kartvizitler']::module_id[],
  array[]::responsibility[], 'mert@heliosscitech.com';


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
