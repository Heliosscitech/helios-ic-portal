-- =====================================================================
-- Helios İç Portal — Dashboard Hızlı Linkler
-- =====================================================================
-- Ana sayfanın sağ kolonundaki "Hızlı linkler" bölümünün veritabanı.
-- Tüm authenticated kullanıcılar görüp ekleyebilir/düzenleyebilir/silebilir.
-- =====================================================================

create table public.dashboard_quick_links (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  url          text not null,
  initial      text,
  color        text,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index on public.dashboard_quick_links (position);

alter table public.dashboard_quick_links enable row level security;

create policy "auth full" on public.dashboard_quick_links
  for all to authenticated using (true) with check (true);
