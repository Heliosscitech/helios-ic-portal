-- =====================================================================
-- Helios İç Portal — Ekip-paylaşımlı modüllere açık yazma yetkisi
-- =====================================================================
-- 7 kişilik güvenilir ekip için: auth olan herkes ekip-paylaşımlı
-- modüllerde tam CRUD yapabilir. Mevcut sıkı politikalar (yonetici/owner)
-- duruyor — RLS politikaları OR'lanır, yani daha geniş bir politika
-- eklemek yetkiyi açar.
--
-- AÇILANLAR (auth herkes yazabilir):
--   board_tasks, board_task_assignees, board_task_comments,
--   board_columns, calendar_events, calendar_event_attendees,
--   business_cards, checklist_items, checklist_runs,
--   experiments, lab_devices, distributors, distributor_steps,
--   projects, project_members, project_work_packages,
--   project_report_periods, press_items,
--   onboarding_people, onboarding_phases, onboarding_tasks,
--   onboarding_phase_templates, onboarding_task_templates
--
-- KALAN (sıkı):
--   users (sadece yönetici / self-update)
--   leave_requests (gizlilik: sahip + manager + yönetici)
--   purchase_requests (purchasing yetkisi)
--   notifications / notification_targets (kişisel)
-- =====================================================================

create policy "auth full" on public.board_tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.board_task_assignees
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.board_task_comments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.calendar_events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.calendar_event_attendees
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.business_cards
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.checklist_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.checklist_runs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.experiments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.lab_devices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.distributors
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.distributor_steps
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.project_members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.project_work_packages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.project_report_periods
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.press_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "auth full" on public.onboarding_people
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.onboarding_phases
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.onboarding_tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.onboarding_phase_templates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full" on public.onboarding_task_templates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
