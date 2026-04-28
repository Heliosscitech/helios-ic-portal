-- =====================================================================
-- Helios İç Portal — Board kolonları
-- =====================================================================
-- 0001'de board_tasks.status enum'du ('todo','doing','done') ama UI
-- dinamik kolon eklemeye izin veriyor. Bu migration:
--   1. status'u text'e çevirir (esneklik)
--   2. board_columns tablosu ekler
--   3. Default 3 kolonu seed eder
-- =====================================================================

-- 1. board_tasks.status → text
alter table public.board_tasks alter column status drop default;
alter table public.board_tasks alter column status type text using status::text;
alter table public.board_tasks alter column status set default 'todo';

-- 2. board_columns
create table public.board_columns (
  id         text primary key,
  title      text not null,
  dot        text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.board_columns enable row level security;

create policy "auth read" on public.board_columns
  for select using (auth.role() = 'authenticated');
create policy "yonetici full" on public.board_columns
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "auth write" on public.board_columns
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3. Default kolonlar
insert into public.board_columns (id, title, dot, position) values
  ('todo',  'Yapılacak',     'bg-gray-400',   0),
  ('doing', 'Devam Ediyor',  'bg-amber-500',  1),
  ('done',  'Tamamlandı',    'bg-teal-500',   2);
