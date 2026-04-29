-- =====================================================================
-- Helios İç Portal — Onboarding şablon görevlerine atanan kişi
-- =====================================================================
-- TS tipinde TaskTemplate.assignee: string vardı ama 0001'deki
-- onboarding_task_templates tablosunda assignee kolonu yoktu.
-- Tamamlıyoruz.
-- =====================================================================

alter table public.onboarding_task_templates
  add column if not exists assignee text;
