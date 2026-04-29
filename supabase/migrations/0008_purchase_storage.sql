-- =====================================================================
-- Helios İç Portal — purchase-attachments bucket için Storage RLS
-- =====================================================================
-- Satın alma faturaları/dosyaları için yükleme/okuma politikaları.
-- Tüm authenticated kullanıcılar görebilir; yükleyen kendi dosyasını
-- silebilir. purchase_requests RLS'i hangi talebin path'inin nerede
-- görüneceğini sınırlar.
-- =====================================================================

create policy "purchase attach upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'purchase-attachments');

create policy "purchase attach read" on storage.objects
  for select to authenticated
  using (bucket_id = 'purchase-attachments');

create policy "purchase attach delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'purchase-attachments' and owner = auth.uid());
