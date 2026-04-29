-- =====================================================================
-- Helios İç Portal — Satın alma talebi: atanan kişi update edebilsin
-- =====================================================================
-- 0001'de purchase_requests update yetkisi yalnızca:
--   - yönetici (yonetici full)
--   - "purchasing" responsibility'sine sahip (has_purchasing)
--   - olusturan, status='yeni' iken (creator update own)
-- olarak tanımlanmıştı. Atanan kişinin (assigned_to) status değiştirme
-- yetkisi yoktu — bu eksiği gideriyoruz.
-- =====================================================================

create policy "purchase assignee update" on public.purchase_requests
  for update to authenticated
  using (assigned_to = auth.uid());
