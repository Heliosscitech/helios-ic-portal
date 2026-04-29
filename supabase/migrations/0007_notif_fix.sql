-- =====================================================================
-- Helios İç Portal — Bildirim INSERT politikalarını düzelt
-- =====================================================================
-- 0001'deki "auth.role() = 'authenticated'" check'i bazı durumlarda
-- bloklıyor (RLS 42501 hatası). Daha güvenilir olan "to authenticated"
-- klozu kullanarak yeniden tanımlıyoruz. Eski politikalar kalabilir
-- (RLS permissive politikaları OR'lar).
--
-- Ayrıca: kullanıcı kendi gönderdiği bildirimi INSERT sonrası SELECT
-- edebilmeli (supabase-js .select() chain'i için). Bunun için actor_id
-- üzerinden SELECT politikası ekleniyor.
-- =====================================================================

create policy "notif insert any auth" on public.notifications
  for insert to authenticated
  with check (true);

create policy "notif targets insert any auth" on public.notification_targets
  for insert to authenticated
  with check (true);

create policy "notif read own actor" on public.notifications
  for select to authenticated
  using (actor_id = auth.uid());
