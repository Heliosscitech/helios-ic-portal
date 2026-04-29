-- =====================================================================
-- Helios İç Portal — Yeni bildirim tipi: onboarding-task-done
-- =====================================================================
-- Onboarding görevini biri tamamladığında, görevin atananı bildirim alsın.
-- Bildirim enum'una yeni değer ekleniyor.
-- =====================================================================

alter type notification_type add value if not exists 'onboarding-task-done';
