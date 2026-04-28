-- =====================================================================
-- Helios İç Portal — Bildirim hedeflerini silme yetkisi
-- =====================================================================
-- Kullanıcının kendi notification_targets kayıtlarını silebilmesi gerekiyor
-- (bell'deki "Tümünü temizle" butonu için). 0001'de yalnızca yönetici
-- silebiliyordu — bu eksikliği gideriyor.
-- =====================================================================

create policy "notif targets self delete" on public.notification_targets
  for delete using (user_id = auth.uid());
