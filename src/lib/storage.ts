import { supabase } from './supabase';

/**
 * Bucket'taki bir dosyayı kullanıcıya indirme olarak sunar.
 * Supabase'in `download: filename` opsiyonu Content-Disposition: attachment
 * header'ı ekler — tarayıcı tab'da açmak yerine doğrudan indirir.
 */
export async function downloadFromBucket(
  bucket: string,
  path: string,
  filename: string
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 5, { download: filename }); // 5 dk yeterli, indirme hemen başlıyor

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'İmzalı URL üretilemedi' };
  }

  const a = document.createElement('a');
  a.href = data.signedUrl;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { ok: true };
}
