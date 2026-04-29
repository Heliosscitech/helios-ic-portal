-- =====================================================================
-- Helios İç Portal — SOP / Prosedür kütüphanesi
-- =====================================================================
-- Standard Operating Procedure ve prosedür belgelerinin metadata
-- (başlık, kategori, versiyon, sahibi, Drive linki, özet, etiketler)
-- indeksini tutar. Belge içeriği Drive'da kalır; portal sadece referans.
-- =====================================================================

create type sop_category as enum (
  'sentez',
  'karakterizasyon',
  'kalite-kontrol',
  'guvenlik',
  'cihaz-kullanimi',
  'satin-alma',
  'ihracat-sevkiyat',
  'idari'
);

create table public.sop_procedures (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      sop_category not null,
  version       text not null default 'v1.0',
  last_updated  date not null default current_date,
  owner_id      uuid not null references public.users(id) on delete restrict,
  drive_url     text,
  summary       text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger sop_procedures_set_updated_at before update on public.sop_procedures
  for each row execute function public.set_updated_at();

create index on public.sop_procedures (category);
create index on public.sop_procedures (owner_id);

alter table public.sop_procedures enable row level security;

create policy "auth read" on public.sop_procedures
  for select to authenticated using (true);

create policy "auth full" on public.sop_procedures
  for all to authenticated
  using (true) with check (true);
