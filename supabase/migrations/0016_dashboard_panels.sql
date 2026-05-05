-- =====================================================================
-- Helios İç Portal — Dashboard Panel Veritabanı
-- =====================================================================
-- Ana sayfa (Dashboard) sekmelerinin (Duyurular, Rehber, Künye, Notlar)
-- veritabanı tabloları. Tüm authenticated kullanıcılar görür ve
-- düzenler (open team write — 0005 ile aynı pattern).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Duyurular
-- ---------------------------------------------------------------------
create type dashboard_priority as enum ('normal', 'onemli', 'acil');

create table public.dashboard_announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  priority    dashboard_priority not null default 'normal',
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on public.dashboard_announcements (created_at desc);

-- ---------------------------------------------------------------------
-- 2) Rehber — gruplar + üyeler
-- ---------------------------------------------------------------------
create table public.dashboard_directory_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.dashboard_directory_contacts (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.dashboard_directory_groups(id) on delete cascade,
  name        text not null,
  role        text,
  phone       text,
  email       text,
  notes       text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.dashboard_directory_contacts (group_id);

-- ---------------------------------------------------------------------
-- 3) Künye — sabit bilgi giriş listeleri
-- ---------------------------------------------------------------------
create type dashboard_identity_category as enum ('adresler', 'sabit-hatlar', 'sirket-bilgileri');

create table public.dashboard_identity_entries (
  id          uuid primary key default gen_random_uuid(),
  category    dashboard_identity_category not null,
  label       text not null,
  value       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.dashboard_identity_entries (category, position);

-- ---------------------------------------------------------------------
-- 4) Notlar
-- ---------------------------------------------------------------------
create type dashboard_note_category as enum ('genel', 'giris-bilgileri', 'kargo-adresleri');

create table public.dashboard_notes (
  id          uuid primary key default gen_random_uuid(),
  category    dashboard_note_category not null,
  title       text not null,
  content     text,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.dashboard_notes (category, created_at desc);
create trigger dashboard_notes_set_updated_at before update on public.dashboard_notes
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS — open team write (0005 pattern'i)
-- =====================================================================
alter table public.dashboard_announcements        enable row level security;
alter table public.dashboard_directory_groups     enable row level security;
alter table public.dashboard_directory_contacts   enable row level security;
alter table public.dashboard_identity_entries     enable row level security;
alter table public.dashboard_notes                enable row level security;

create policy "auth full" on public.dashboard_announcements
  for all to authenticated using (true) with check (true);
create policy "auth full" on public.dashboard_directory_groups
  for all to authenticated using (true) with check (true);
create policy "auth full" on public.dashboard_directory_contacts
  for all to authenticated using (true) with check (true);
create policy "auth full" on public.dashboard_identity_entries
  for all to authenticated using (true) with check (true);
create policy "auth full" on public.dashboard_notes
  for all to authenticated using (true) with check (true);
