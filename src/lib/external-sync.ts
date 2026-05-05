import { supabase } from './supabase';

// Edge function'ı tetikleyip helios-portal'dan canlı veri çeker (~1-3 sn).
// Çağıran tarafından bekleniyor; başarısızlık durumu logla, mirror'dan yine de
// okuma yapılabilsin diye throw etmiyoruz.
export const triggerExternalSync = async (): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('sync-from-helios-portal');
    if (error) console.error('sync trigger failed', error);
  } catch (e) {
    console.error('sync trigger failed', e);
  }
};
