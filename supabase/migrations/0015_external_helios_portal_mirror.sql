-- =====================================================================
-- Helios İç Portal — helios-portal mirror tabloları (read-only)
-- =====================================================================
-- helios-portal Supabase projesinden periyodik olarak çekilen verilerin
-- yerel kopyaları. Yazma `sync-from-helios-portal` edge function'ı
-- üzerinden service role ile yapılır; uygulama sadece okur.
-- Bu tablolardan asla manuel insert/update yapılmaz.
-- =====================================================================

-- ---------------------------------------------------------------------
-- accounting_ledger  (Ön Muhasebe + Runway)
-- ---------------------------------------------------------------------
create table public.external_accounting_ledger (
  id            uuid primary key,
  tarih         date not null,
  tip           text not null,
  aciklama      text,
  tutar         double precision not null,
  para_birimi   text,
  kategori      text,
  fatura_no     text,
  referans_id   text,
  created_at    timestamptz not null,
  synced_at     timestamptz not null default now()
);
create index on public.external_accounting_ledger (tarih);
create index on public.external_accounting_ledger (tip);

-- ---------------------------------------------------------------------
-- customers  (Sales join)
-- ---------------------------------------------------------------------
create table public.external_customers (
  id            uuid primary key,
  ad            text not null,
  tur           text,
  vergi_no      text,
  telefon       text,
  email         text,
  adres         text,
  notlar        text,
  satis_count   bigint,
  country       text,
  created_at    timestamptz not null,
  synced_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- lab_inventory  (Lab Stok)
-- ---------------------------------------------------------------------
create table public.external_lab_inventory (
  id              uuid primary key,
  name            text not null,
  category        text not null,
  quantity        double precision,
  min_stock       double precision,
  unit            text,
  location        text,
  notes           text,
  model           text,
  serial          text,
  chem_type       text,
  cas             text,
  purity          text,
  storage         text,
  hazards         text[],
  synthesis_date  date,
  mof_yield       text,
  color           text,
  appearance      text,
  created_at      timestamptz not null,
  updated_at      timestamptz not null,
  synced_at       timestamptz not null default now()
);
create index on public.external_lab_inventory (category);

-- ---------------------------------------------------------------------
-- lab_history  (Lab Stok hareket geçmişi)
-- ---------------------------------------------------------------------
create table public.external_lab_history (
  id                 uuid primary key,
  action             text not null,
  item               text not null,
  detail             text,
  date               timestamptz not null,
  inventory_item_id  uuid,
  synced_at          timestamptz not null default now()
);
create index on public.external_lab_history (inventory_item_id);
create index on public.external_lab_history (date desc);

-- ---------------------------------------------------------------------
-- projects  (project_expenses join)
-- ---------------------------------------------------------------------
create table public.external_projects (
  id          uuid primary key,
  name        text not null,
  no          text,
  program     text not null,
  budget      text,
  is_genel    boolean,
  created_at  timestamptz not null,
  synced_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- project_expenses  (Runway alternatif kaynak)
-- ---------------------------------------------------------------------
create table public.external_project_expenses (
  id                  uuid primary key,
  project_id          uuid,
  tarih               date not null,
  belge_no            text,
  belge_tarih         date,
  kategori            text,
  aciklama            text,
  miktar              double precision,
  birim_fiyat         double precision,
  kdv_orani           double precision,
  tutar_kdv_haric     double precision,
  tutar_kdv_dahil     double precision,
  para_birimi         text,
  dus_om_bakiye       boolean,
  yurtdisi_alimi      text,
  notlar              text,
  created_at          timestamptz not null,
  synced_at           timestamptz not null default now()
);
create index on public.external_project_expenses (project_id);
create index on public.external_project_expenses (tarih);

-- ---------------------------------------------------------------------
-- sales_records  (Satış)
-- ---------------------------------------------------------------------
create table public.external_sales_records (
  id                  uuid primary key,
  tarih               date not null,
  fatura_no           text,
  musteri_id          uuid,
  musteri_adi         text,
  urun_hizmet_adi     text,
  kategori            text,
  miktar              double precision,
  birim               text,
  birim_fiyat         double precision,
  para_birimi         text,
  kdv_orani           double precision,
  tutar_kdv_haric     double precision,
  tutar_kdv_dahil     double precision,
  tahsilat_durumu     text,
  odeme_yontemi       text,
  notlar              text,
  fatura_tarihi       date,
  vade_tarihi         date,
  musteri_turu        text,
  musteri_vergi_no    text,
  yurtdisi            text,
  irsaliye_no         text,
  tahsilat_tarihi     date,
  tahsil_edilen       double precision,
  inventory_item_id   uuid,
  created_at          timestamptz not null,
  synced_at           timestamptz not null default now()
);
create index on public.external_sales_records (tarih desc);
create index on public.external_sales_records (musteri_id);
create index on public.external_sales_records (tahsilat_durumu);

-- ---------------------------------------------------------------------
-- tahsilat_logs  (Ön Muhasebe — kısmi tahsilat kayıtları)
-- ---------------------------------------------------------------------
create table public.external_tahsilat_logs (
  id          uuid primary key,
  satis_id    uuid,
  tutar       double precision not null,
  tarih       date not null,
  notlar      text,
  created_at  timestamptz not null,
  synced_at   timestamptz not null default now()
);
create index on public.external_tahsilat_logs (satis_id);
create index on public.external_tahsilat_logs (tarih desc);

-- ---------------------------------------------------------------------
-- Sync metadata: son başarılı çalışma zamanı, satır sayıları
-- ---------------------------------------------------------------------
create table public.external_sync_runs (
  id              bigserial primary key,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  ok              boolean,
  error_message   text,
  rows_summary    jsonb
);
create index on public.external_sync_runs (started_at desc);

-- =====================================================================
-- RLS — uygulama sadece okur. Yazma service role ile bypass edilir.
-- =====================================================================
alter table public.external_accounting_ledger  enable row level security;
alter table public.external_customers          enable row level security;
alter table public.external_lab_inventory      enable row level security;
alter table public.external_lab_history        enable row level security;
alter table public.external_projects           enable row level security;
alter table public.external_project_expenses   enable row level security;
alter table public.external_sales_records      enable row level security;
alter table public.external_tahsilat_logs      enable row level security;
alter table public.external_sync_runs          enable row level security;

create policy "external read"  on public.external_accounting_ledger for select to authenticated using (true);
create policy "external read"  on public.external_customers         for select to authenticated using (true);
create policy "external read"  on public.external_lab_inventory     for select to authenticated using (true);
create policy "external read"  on public.external_lab_history       for select to authenticated using (true);
create policy "external read"  on public.external_projects          for select to authenticated using (true);
create policy "external read"  on public.external_project_expenses  for select to authenticated using (true);
create policy "external read"  on public.external_sales_records     for select to authenticated using (true);
create policy "external read"  on public.external_tahsilat_logs     for select to authenticated using (true);
create policy "external read"  on public.external_sync_runs         for select to authenticated using (true);
