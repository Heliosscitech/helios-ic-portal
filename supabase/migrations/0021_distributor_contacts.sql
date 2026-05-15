-- Distribütör iletişim kişilerini sabit c1/c2 kolonlarından dinamik
-- bir jsonb dizisine taşı. Böylece ikiden fazla kişi eklenebilir.
-- Eski c1_*/c2_* kolonları geriye dönük uyumluluk için korunur.

ALTER TABLE public.distributors
  ADD COLUMN IF NOT EXISTS contacts jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Mevcut c1/c2 verisini, en az bir alanı dolu olanları, contacts dizisine taşı.
UPDATE public.distributors
SET contacts = (
  SELECT coalesce(jsonb_agg(c), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'name',  coalesce(c1_name, ''),
      'title', coalesce(c1_title, ''),
      'email', coalesce(c1_email, ''),
      'phone', coalesce(c1_phone, '')
    ) AS c
    WHERE coalesce(c1_name, c1_title, c1_email, c1_phone) IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object(
      'name',  coalesce(c2_name, ''),
      'title', coalesce(c2_title, ''),
      'email', coalesce(c2_email, ''),
      'phone', coalesce(c2_phone, '')
    )
    WHERE coalesce(c2_name, c2_title, c2_email, c2_phone) IS NOT NULL
  ) s
)
WHERE contacts = '[]'::jsonb;
