-- =====================================================================
-- Helios İç Portal — Supabase Initial Schema
-- =====================================================================
-- Tek tenant. RLS: auth herkes okur, sahip/yönetici yazar.
-- Realtime yalnızca notifications + notification_targets için açılır.
-- Stub modüller (lab-book, lab-stok, sop-prosedur, on-muhasebe, satis,
-- runway) bu migration'a dahil değil — tipi netleşince ayrı PR.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions & helpers
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;


-- ---------------------------------------------------------------------
-- 1. Enum types
-- ---------------------------------------------------------------------
create type user_role           as enum ('yonetici', 'calisan');
create type responsibility      as enum ('purchasing');
create type module_id           as enum (
  'pano','takvim','lab-checklist','izin-mazeret','lab-book','satin-alma',
  'board','on-muhasebe','satis','projeler','kartvizitler','onboarding',
  'basin','sop-prosedur','runway','arge-plani','lab-stok','distributor','kullanicilar'
);
create type unit_id             as enum ('arge','is-gelistirme','uretim','satis','idari');
create type department_id       as enum ('arge','is-gelistirme','operasyon');

create type task_priority       as enum ('low','medium','high');
create type task_status         as enum ('todo','doing','done');

create type experiment_status   as enum ('bekliyor','yapiliyor','tamamlandi');
create type analysis_state      as enum ('','planned','done');

create type leave_reason        as enum ('saglik','aile','resmi','egitim','ulasim','diger');
create type leave_status        as enum ('pending','approved','rejected');
create type leave_belge_status  as enum ('Sonradan getireceğim','Ekledim','Gerekli değil');

create type purchase_type       as enum ('kimyasal','sarf','ekipman','ariza','hizmet','diger');
create type purchase_status     as enum ('yeni','siparis-verildi','geldi','iptal-iade');
create type purchase_urgency    as enum ('normal','yuksek','acil');
create type storage_kind        as enum ('','oda','4c','-20c','-80c','yanici');

create type distributor_region  as enum (
  'avrupa','kuzey-amerika','guney-amerika','asya-pasifik',
  'orta-dogu-kafrika','sahra-alti-afrika','okyanusya'
);
create type distributor_status  as enum (
  'arastirilacak','mail-atildi','follow-up','gorusme-planlandi',
  'numune-gonderildi','teklif-hazirlandi','sozlesme-imzalandi','pasif'
);
create type follow_up_step      as enum (
  'ilk-mail','fu-1','fu-2','meet','toplanti','numune','teklif','sozlesme'
);

create type project_status      as enum ('aktif','tamamlandi','duraklatildi');
create type wp_status           as enum ('bekliyor','devam','tamam');

create type press_category      as enum ('Haber','Duyuru','Bülten');
create type contact_type        as enum ('customer','investor','academic','supplier','other');

create type checklist_tab       as enum ('haftalik','aylik','temizlik');
create type checklist_status    as enum ('ok','problem');

create type notification_source as enum (
  'board','takvim','lab-checklist','leave','onboarding',
  'kartvizit','satin-alma','distributor','arge'
);
create type notification_type   as enum (
  'task-created','task-assigned','task-status-changed','task-updated','task-deleted',
  'event-created','event-deleted','lab-problem-reported',
  'leave-requested','leave-approved','leave-rejected',
  'onboarding-person-added','contact-created',
  'purchase-assigned','purchase-status-changed',
  'distributor-assigned','experiment-assigned'
);


-- ---------------------------------------------------------------------
-- 2. users (auth-bound)
-- ---------------------------------------------------------------------
create table public.users (
  id               uuid primary key references auth.users(id) on delete cascade,
  legacy_id        text unique,
  name             text not null,
  initials         text not null,
  role             text not null,
  color            text not null,
  user_role        user_role not null default 'calisan',
  allowed_modules  module_id[] not null default '{}',
  responsibilities responsibility[] not null default '{}',
  email            text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 3. board_tasks
-- ---------------------------------------------------------------------
create table public.board_tasks (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  unit_id        unit_id not null,
  status         task_status not null default 'todo',
  priority       task_priority not null default 'medium',
  due_date       date,
  creator_id     uuid not null references public.users(id) on delete restrict,
  tags           text[] not null default '{}',
  comments_count integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger board_tasks_set_updated_at before update on public.board_tasks
  for each row execute function public.set_updated_at();

create table public.board_task_assignees (
  task_id uuid references public.board_tasks(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  primary key (task_id, user_id)
);

create table public.board_task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.board_tasks(id) on delete cascade,
  author_id  uuid not null references public.users(id) on delete restrict,
  body       text not null,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 4. calendar_events
-- ---------------------------------------------------------------------
create table public.calendar_events (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  event_date date not null,
  event_time time,
  author_id  uuid not null references public.users(id) on delete restrict,
  color_key  text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger calendar_events_set_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();

create table public.calendar_event_attendees (
  event_id uuid references public.calendar_events(id) on delete cascade,
  user_id  uuid references public.users(id) on delete cascade,
  primary key (event_id, user_id)
);


-- ---------------------------------------------------------------------
-- 5. business_cards
-- ---------------------------------------------------------------------
create table public.business_cards (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  title         text,
  company       text,
  email         text,
  phone         text,
  tags          text[] not null default '{}',
  contact_type  contact_type not null default 'other',
  meeting_place text,
  meeting_date  date,
  notes         text,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger business_cards_set_updated_at before update on public.business_cards
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 6. lab checklist
-- ---------------------------------------------------------------------
create table public.checklist_items (
  id          uuid primary key default gen_random_uuid(),
  tab         checklist_tab not null,
  name        text not null,
  instruction text not null,
  is_custom   boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.checklist_runs (
  id          uuid primary key default gen_random_uuid(),
  tab         checklist_tab not null,
  period_key  text not null,
  item_id     uuid not null references public.checklist_items(id) on delete cascade,
  status      checklist_status,
  comment     text,
  assignee_id uuid references public.users(id) on delete set null,
  recorded_by uuid references public.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  unique (tab, period_key, item_id)
);


-- ---------------------------------------------------------------------
-- 7. experiments + lab_devices
-- ---------------------------------------------------------------------
create table public.experiments (
  id               uuid primary key default gen_random_uuid(),
  code             text not null,
  mof              text not null,
  name             text not null,
  purpose          text,
  owner_id         uuid not null references public.users(id) on delete restrict,
  device           text,
  start_date       date,
  end_date         date,
  synthesis_amount text,
  workup_amount    text,
  eln_link         text,
  bet              analysis_state not null default '',
  xrd              analysis_state not null default '',
  sem              analysis_state not null default '',
  status           experiment_status not null default 'bekliyor',
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger experiments_set_updated_at before update on public.experiments
  for each row execute function public.set_updated_at();

create table public.lab_devices (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);


-- ---------------------------------------------------------------------
-- 8. leave_requests
-- ---------------------------------------------------------------------
create table public.leave_requests (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.users(id) on delete restrict,
  department     department_id not null,
  manager_id     uuid not null references public.users(id) on delete restrict,
  email          text not null,
  range_start    timestamptz not null,
  range_end      timestamptz not null,
  reason         leave_reason not null,
  reason_detail  text,
  belge_status   leave_belge_status not null,
  belge_path     text,
  belge_filename text,
  telafi_notu    text,
  telafi_gunleri date[] not null default '{}',
  submitted_at   timestamptz not null default now(),
  status         leave_status not null default 'pending',
  reviewer_note  text,
  reviewed_at    timestamptz,
  reviewed_by    uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (range_end >= range_start)
);
create trigger leave_requests_set_updated_at before update on public.leave_requests
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 9. onboarding (people / phases / tasks + templates)
-- ---------------------------------------------------------------------
create table public.onboarding_people (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text,
  start_date date,
  owner_id   uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger onboarding_people_set_updated_at before update on public.onboarding_people
  for each row execute function public.set_updated_at();

create table public.onboarding_phases (
  id        uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.onboarding_people(id) on delete cascade,
  title     text not null,
  position  integer not null default 0
);

create table public.onboarding_tasks (
  id          uuid primary key default gen_random_uuid(),
  phase_id    uuid not null references public.onboarding_phases(id) on delete cascade,
  title       text not null,
  description text,
  assignee    text,
  is_done     boolean not null default false,
  position    integer not null default 0
);

create table public.onboarding_phase_templates (
  id       uuid primary key default gen_random_uuid(),
  title    text not null,
  position integer not null default 0
);

create table public.onboarding_task_templates (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.onboarding_phase_templates(id) on delete cascade,
  title       text not null,
  description text,
  position    integer not null default 0
);


-- ---------------------------------------------------------------------
-- 10. projects (+ work packages, report periods, members)
-- ---------------------------------------------------------------------
create table public.projects (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name       text not null,
  subtitle   text,
  color      text not null,
  start_date date,
  end_date   date,
  leader_id  uuid not null references public.users(id) on delete restrict,
  status     project_status not null default 'aktif',
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  primary key (project_id, user_id)
);

create table public.project_work_packages (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title      text not null,
  status     wp_status not null default 'bekliyor',
  deadline   date,
  notes      text,
  position   integer not null default 0
);

create table public.project_report_periods (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title      text not null,
  due_date   date,
  status     wp_status not null default 'bekliyor',
  position   integer not null default 0
);


-- ---------------------------------------------------------------------
-- 11. purchase_requests
-- ---------------------------------------------------------------------
create table public.purchase_requests (
  id              uuid primary key default gen_random_uuid(),
  type            purchase_type not null,
  title           text not null,
  description     text,
  link            text,
  estimated_price text,
  urgency         purchase_urgency not null default 'normal',
  quantity        text,
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  attachment_mime text,
  status          purchase_status not null default 'yeni',
  created_by      uuid not null references public.users(id) on delete restrict,
  assigned_to     uuid references public.users(id) on delete set null,
  details_kind    purchase_type,
  details         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (details_kind is null or details_kind = type)
);
create trigger purchase_requests_set_updated_at before update on public.purchase_requests
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 12. distributors
-- ---------------------------------------------------------------------
create table public.distributors (
  id         uuid primary key default gen_random_uuid(),
  region     distributor_region not null,
  country    text not null,
  name       text not null,
  website    text,
  expertise  text,
  c1_name    text, c1_title text, c1_email text, c1_phone text,
  c2_name    text, c2_title text, c2_email text, c2_phone text,
  status     distributor_status not null default 'arastirilacak',
  owner_id   uuid references public.users(id) on delete set null,
  next_step  text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger distributors_set_updated_at before update on public.distributors
  for each row execute function public.set_updated_at();

create table public.distributor_steps (
  distributor_id uuid not null references public.distributors(id) on delete cascade,
  step           follow_up_step not null,
  done           boolean not null default true,
  done_at        timestamptz default now(),
  primary key (distributor_id, step)
);


-- ---------------------------------------------------------------------
-- 13. press_items
-- ---------------------------------------------------------------------
create table public.press_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  publish_date date,
  category     press_category not null default 'Haber',
  linkedin     text,
  website      text,
  instagram    text,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger press_items_set_updated_at before update on public.press_items
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 14. notifications + targets
-- ---------------------------------------------------------------------
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  type         notification_type not null,
  source       notification_source not null,
  entity_id    text,
  entity_title text,
  actor_id     uuid references public.users(id) on delete set null,
  message      text not null,
  created_at   timestamptz not null default now()
);

create table public.notification_targets (
  notification_id uuid references public.notifications(id) on delete cascade,
  user_id         uuid references public.users(id) on delete cascade,
  read_at         timestamptz,
  primary key (notification_id, user_id)
);


-- ---------------------------------------------------------------------
-- 15. Indexes
-- ---------------------------------------------------------------------
create index on public.board_tasks (creator_id);
create index on public.board_tasks (unit_id, status);
create index on public.board_task_assignees (user_id);
create index on public.calendar_events (event_date);
create index on public.experiments (owner_id) where archived = false;
create index on public.leave_requests (employee_id);
create index on public.leave_requests (manager_id, status);
create index on public.purchase_requests (status);
create index on public.purchase_requests (assigned_to) where assigned_to is not null;
create index on public.distributors (region, status);
create index on public.distributors (owner_id) where owner_id is not null;
create index on public.notifications (created_at desc);
create index on public.notification_targets (user_id) where read_at is null;


-- ---------------------------------------------------------------------
-- 16. RLS — auth herkes okur, sahip / yönetici yazar
-- ---------------------------------------------------------------------
create or replace function public.is_yonetici()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and user_role = 'yonetici'
  );
$$;

create or replace function public.has_purchasing()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and ('purchasing' = any(responsibilities) or user_role = 'yonetici')
  );
$$;

-- Tablolarda RLS aç
alter table public.users                       enable row level security;
alter table public.board_tasks                 enable row level security;
alter table public.board_task_assignees        enable row level security;
alter table public.board_task_comments         enable row level security;
alter table public.calendar_events             enable row level security;
alter table public.calendar_event_attendees    enable row level security;
alter table public.business_cards              enable row level security;
alter table public.checklist_items             enable row level security;
alter table public.checklist_runs              enable row level security;
alter table public.experiments                 enable row level security;
alter table public.lab_devices                 enable row level security;
alter table public.leave_requests              enable row level security;
alter table public.onboarding_people           enable row level security;
alter table public.onboarding_phases           enable row level security;
alter table public.onboarding_tasks            enable row level security;
alter table public.onboarding_phase_templates  enable row level security;
alter table public.onboarding_task_templates   enable row level security;
alter table public.projects                    enable row level security;
alter table public.project_members             enable row level security;
alter table public.project_work_packages       enable row level security;
alter table public.project_report_periods      enable row level security;
alter table public.purchase_requests           enable row level security;
alter table public.distributors                enable row level security;
alter table public.distributor_steps           enable row level security;
alter table public.press_items                 enable row level security;
alter table public.notifications               enable row level security;
alter table public.notification_targets        enable row level security;

-- Genel okuma: tüm authenticated kullanıcılar her tabloyu görebilir
create policy "auth read" on public.users
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.board_tasks
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.board_task_assignees
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.board_task_comments
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.calendar_events
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.calendar_event_attendees
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.business_cards
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.checklist_items
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.checklist_runs
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.experiments
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.lab_devices
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.onboarding_people
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.onboarding_phases
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.onboarding_tasks
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.onboarding_phase_templates
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.onboarding_task_templates
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.projects
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.project_members
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.project_work_packages
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.project_report_periods
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.purchase_requests
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.distributors
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.distributor_steps
  for select using (auth.role() = 'authenticated');
create policy "auth read" on public.press_items
  for select using (auth.role() = 'authenticated');

-- leave_requests: yalnız sahip + manager + yönetici okur
create policy "leave read scoped" on public.leave_requests
  for select using (
    employee_id = auth.uid()
    or manager_id = auth.uid()
    or public.is_yonetici()
  );

-- notifications: hedef kullanıcı + yönetici okur
create policy "notif read targeted" on public.notifications
  for select using (
    public.is_yonetici()
    or exists (
      select 1 from public.notification_targets nt
      where nt.notification_id = id and nt.user_id = auth.uid()
    )
  );
create policy "notif targets read own" on public.notification_targets
  for select using (user_id = auth.uid() or public.is_yonetici());

-- ====== WRITE policies ======

-- users: sadece yönetici yazabilir, kullanıcı kendi profilini güncelleyebilir
create policy "users yonetici full" on public.users
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "users self update" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- board_tasks: yönetici full, oluşturan + atanan update
create policy "tasks yonetici full" on public.board_tasks
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "tasks creator insert" on public.board_tasks
  for insert with check (creator_id = auth.uid());
create policy "tasks creator update" on public.board_tasks
  for update using (creator_id = auth.uid());
create policy "tasks assignee update" on public.board_tasks
  for update using (
    exists (select 1 from public.board_task_assignees
            where task_id = id and user_id = auth.uid())
  );
create policy "tasks creator delete" on public.board_tasks
  for delete using (creator_id = auth.uid());

create policy "task assignees yonetici" on public.board_task_assignees
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "task assignees by creator" on public.board_task_assignees
  for all using (
    exists (select 1 from public.board_tasks t
            where t.id = task_id and t.creator_id = auth.uid())
  );

create policy "task comments yonetici" on public.board_task_comments
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "task comments author" on public.board_task_comments
  for insert with check (author_id = auth.uid());
create policy "task comments author update" on public.board_task_comments
  for update using (author_id = auth.uid());
create policy "task comments author delete" on public.board_task_comments
  for delete using (author_id = auth.uid());

-- calendar_events
create policy "events yonetici full" on public.calendar_events
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "events author insert" on public.calendar_events
  for insert with check (author_id = auth.uid());
create policy "events author update" on public.calendar_events
  for update using (author_id = auth.uid());
create policy "events author delete" on public.calendar_events
  for delete using (author_id = auth.uid());
create policy "event attendees yonetici" on public.calendar_event_attendees
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "event attendees author" on public.calendar_event_attendees
  for all using (
    exists (select 1 from public.calendar_events e
            where e.id = event_id and e.author_id = auth.uid())
  );

-- business_cards: yönetici full, oluşturan kendi kartını yönetir
create policy "cards yonetici full" on public.business_cards
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "cards creator insert" on public.business_cards
  for insert with check (created_by = auth.uid());
create policy "cards creator update" on public.business_cards
  for update using (created_by = auth.uid());
create policy "cards creator delete" on public.business_cards
  for delete using (created_by = auth.uid());

-- checklist: yönetici full, calisan run insert/update
create policy "checklist items yonetici" on public.checklist_items
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "checklist runs yonetici" on public.checklist_runs
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "checklist runs auth write" on public.checklist_runs
  for insert with check (auth.role() = 'authenticated');
create policy "checklist runs recorder update" on public.checklist_runs
  for update using (recorded_by = auth.uid());

-- experiments: yönetici full, owner tam, herkes okur (yukarıda)
create policy "exp yonetici full" on public.experiments
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "exp owner insert" on public.experiments
  for insert with check (owner_id = auth.uid());
create policy "exp owner update" on public.experiments
  for update using (owner_id = auth.uid());
create policy "exp owner delete" on public.experiments
  for delete using (owner_id = auth.uid());
create policy "lab devices yonetici" on public.lab_devices
  for all using (public.is_yonetici()) with check (public.is_yonetici());

-- leave_requests
create policy "leave yonetici full" on public.leave_requests
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "leave employee insert" on public.leave_requests
  for insert with check (employee_id = auth.uid());
create policy "leave employee update own" on public.leave_requests
  for update using (employee_id = auth.uid() and status = 'pending');
create policy "leave manager review" on public.leave_requests
  for update using (manager_id = auth.uid());

-- onboarding: yönetici + İK (purchasing'e benzer ilerde rol eklenebilir, şimdilik yonetici-only write)
create policy "onb people yonetici" on public.onboarding_people
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "onb phases yonetici" on public.onboarding_phases
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "onb tasks yonetici" on public.onboarding_tasks
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "onb tasks self update" on public.onboarding_tasks
  for update using (
    exists (
      select 1 from public.onboarding_phases p
      join public.onboarding_people pe on pe.id = p.person_id
      where p.id = phase_id and pe.owner_id = auth.uid()
    )
  );
create policy "onb phase templates yonetici" on public.onboarding_phase_templates
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "onb task templates yonetici" on public.onboarding_task_templates
  for all using (public.is_yonetici()) with check (public.is_yonetici());

-- projects
create policy "projects yonetici full" on public.projects
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "projects leader update" on public.projects
  for update using (leader_id = auth.uid());
create policy "project members yonetici" on public.project_members
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "project members leader" on public.project_members
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_id and p.leader_id = auth.uid())
  );
create policy "wp yonetici" on public.project_work_packages
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "wp leader" on public.project_work_packages
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_id and p.leader_id = auth.uid())
  );
create policy "rp yonetici" on public.project_report_periods
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "rp leader" on public.project_report_periods
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_id and p.leader_id = auth.uid())
  );

-- purchase_requests: purchasing responsibility veya yönetici
create policy "purchase manage" on public.purchase_requests
  for all using (public.has_purchasing()) with check (public.has_purchasing());
create policy "purchase creator insert" on public.purchase_requests
  for insert with check (created_by = auth.uid());
create policy "purchase creator update own" on public.purchase_requests
  for update using (created_by = auth.uid() and status = 'yeni');

-- distributors
create policy "dist yonetici full" on public.distributors
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "dist owner update" on public.distributors
  for update using (owner_id = auth.uid());
create policy "dist auth insert" on public.distributors
  for insert with check (auth.role() = 'authenticated');
create policy "dist steps yonetici" on public.distributor_steps
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "dist steps owner" on public.distributor_steps
  for all using (
    exists (select 1 from public.distributors d
            where d.id = distributor_id and d.owner_id = auth.uid())
  );

-- press_items
create policy "press yonetici full" on public.press_items
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "press creator update" on public.press_items
  for update using (created_by = auth.uid());

-- notifications
create policy "notif yonetici full" on public.notifications
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "notif auth insert" on public.notifications
  for insert with check (auth.role() = 'authenticated');
create policy "notif targets yonetici" on public.notification_targets
  for all using (public.is_yonetici()) with check (public.is_yonetici());
create policy "notif targets self read update" on public.notification_targets
  for update using (user_id = auth.uid());
create policy "notif targets auth insert" on public.notification_targets
  for insert with check (auth.role() = 'authenticated');


-- ---------------------------------------------------------------------
-- 17. Realtime: yalnızca bildirimler
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.notification_targets;
