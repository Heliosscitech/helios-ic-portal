-- =====================================================================
-- Helios İç Portal — leave-documents bucket için Storage RLS
-- =====================================================================
-- İzin/mazeret belgelerinin yüklenmesi/okunması için politikalar.
-- Tüm authenticated kullanıcılar leave-documents bucket'ına yazabilir
-- ve okuyabilir; leave_requests RLS'i zaten kim hangi yolu görebileceğini
-- sınırlıyor (yalnız sahip + manager + yönetici).
-- =====================================================================

create policy "leave docs upload" on storage.objects
  for insert with check (
    bucket_id = 'leave-documents'
    and auth.role() = 'authenticated'
  );

create policy "leave docs read" on storage.objects
  for select using (
    bucket_id = 'leave-documents'
    and auth.role() = 'authenticated'
  );

create policy "leave docs delete own" on storage.objects
  for delete using (
    bucket_id = 'leave-documents'
    and owner = auth.uid()
  );
