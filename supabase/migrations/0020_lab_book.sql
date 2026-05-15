-- Helios ELN / Lab Book modülü tabloları
-- Bağımlılık sırası: characterizations/materials → experiments → categories
-- + şekillendirme, literatür, eğitim ayrı

-- Önce children, sonra parent (cascade'i takip ederek)
DROP TABLE IF EXISTS public.lab_book_experiment_characterizations CASCADE;
DROP TABLE IF EXISTS public.lab_book_experiment_materials         CASCADE;
DROP TABLE IF EXISTS public.lab_book_experiments                  CASCADE;
DROP TABLE IF EXISTS public.lab_book_shaping_variants             CASCADE;
DROP TABLE IF EXISTS public.lab_book_shaping_records              CASCADE;  -- eski tablo (artık yok)
DROP TABLE IF EXISTS public.lab_book_mof_categories               CASCADE;
DROP TABLE IF EXISTS public.lab_book_literature                   CASCADE;
DROP TABLE IF EXISTS public.lab_book_trainings                    CASCADE;

-- ── MOF Kategorileri ─────────────────────────────────────────────────────────
CREATE TABLE public.lab_book_mof_categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  position   integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER lab_book_mof_categories_set_updated_at
  BEFORE UPDATE ON public.lab_book_mof_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lab_book_mof_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_mof_categories_all" ON public.lab_book_mof_categories
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Şekillendirme Varyantları (MOF başına) ──────────────────────────────────
-- Önce variants tablosu (experiments bunu referans alacak)
CREATE TABLE public.lab_book_shaping_variants (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mof_category_id uuid        NOT NULL REFERENCES public.lab_book_mof_categories(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  position        integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mof_category_id, name)
);

ALTER TABLE public.lab_book_shaping_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_shaping_variants_all" ON public.lab_book_shaping_variants
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Deneyler (hiyerarşik) ────────────────────────────────────────────────────
-- shaping_variant_id NULL ise MOF sentez deneyi, dolu ise şekillendirme deneyi
CREATE TABLE public.lab_book_experiments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mof_category_id     uuid        NOT NULL REFERENCES public.lab_book_mof_categories(id) ON DELETE CASCADE,
  shaping_variant_id  uuid        REFERENCES public.lab_book_shaping_variants(id) ON DELETE CASCADE,
  parent_id           uuid        REFERENCES public.lab_book_experiments(id) ON DELETE CASCADE,
  sub_type            text        CHECK (sub_type IN ('repeat','scale_up','parameter')),
  title               text        NOT NULL,
  batch_no            text        NOT NULL,
  reference_url       text,
  author_id           uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  experiment_date     date        NOT NULL DEFAULT CURRENT_DATE,
  yield_pct           numeric,
  amount              text,
  -- Alt deney türüne özel alanlar
  repeat_reason       text,
  scale_up_detail     text,
  parameter_detail    text,
  -- Markdown bölümler
  general_overview    text,
  reason_diff         text,
  procedure_equipment text,
  plan_results        text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- Tutarlılık: top-level ise parent_id+sub_type NULL; sub_experiment ise her ikisi de dolu
  CONSTRAINT exp_hierarchy_consistency CHECK (
    (parent_id IS NULL AND sub_type IS NULL) OR
    (parent_id IS NOT NULL AND sub_type IS NOT NULL)
  )
);

CREATE INDEX idx_lab_book_experiments_parent_id      ON public.lab_book_experiments(parent_id);
CREATE INDEX idx_lab_book_experiments_mof_category   ON public.lab_book_experiments(mof_category_id);
CREATE INDEX idx_lab_book_experiments_shaping_variant ON public.lab_book_experiments(shaping_variant_id);

CREATE TRIGGER lab_book_experiments_set_updated_at
  BEFORE UPDATE ON public.lab_book_experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lab_book_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_experiments_all" ON public.lab_book_experiments
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Deney Malzemeleri ────────────────────────────────────────────────────────
CREATE TABLE public.lab_book_experiment_materials (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid        NOT NULL REFERENCES public.lab_book_experiments(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  amount        text,
  position      integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_book_materials_experiment ON public.lab_book_experiment_materials(experiment_id);

ALTER TABLE public.lab_book_experiment_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_materials_all" ON public.lab_book_experiment_materials
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Deney Karakterizasyonları ────────────────────────────────────────────────
CREATE TABLE public.lab_book_experiment_characterizations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id   uuid        NOT NULL REFERENCES public.lab_book_experiments(id) ON DELETE CASCADE,
  type            text        NOT NULL,            -- BET / SEM / XRD / TGA / FTIR / Diğer
  value           text,                            -- (legacy) opsiyonel kısa değer
  notes           text,                            -- Sonuç / Yorum (markdown)
  attachment_url  text,                            -- Drive linki
  image_url       text,                            -- Yüklenen görsel (Supabase Storage)
  performed_at    date,
  performed_by_id uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  position        integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_book_chars_experiment ON public.lab_book_experiment_characterizations(experiment_id);

CREATE TRIGGER lab_book_characterizations_set_updated_at
  BEFORE UPDATE ON public.lab_book_experiment_characterizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lab_book_experiment_characterizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_characterizations_all" ON public.lab_book_experiment_characterizations
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- (Şekillendirme varyantları tablosu yukarıda, deneylerden ÖNCE oluşturuldu)
-- (Şekillendirme kayıtları artık ayrı tablo değil; lab_book_experiments tablosunda shaping_variant_id ile tutulur)

-- ── Literatür ────────────────────────────────────────────────────────────────
CREATE TABLE public.lab_book_literature (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  authors      text,
  journal      text,
  year         integer,
  subject      text,                         -- Konu / MOF
  doi          text,
  url          text,
  summary      text,                         -- Özet (markdown)
  helios_notes text,                         -- Helios için Notlar (markdown)
  added_by     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER lab_book_literature_set_updated_at
  BEFORE UPDATE ON public.lab_book_literature
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lab_book_literature ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_literature_all" ON public.lab_book_literature
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Eğitim / Tutorial ────────────────────────────────────────────────────────
CREATE TABLE public.lab_book_trainings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  category     text,                              -- Cihaz Kullanımı / Sentez Protokolü / ...
  level        text,                              -- Başlangıç / Orta / İleri
  url          text,                              -- Drive / Video linki
  purpose      text,                              -- Amaç (markdown)
  steps        text,                              -- Adımlar (markdown)
  safety_notes text,                              -- Uyarılar / Güvenlik (markdown)
  added_by     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER lab_book_trainings_set_updated_at
  BEFORE UPDATE ON public.lab_book_trainings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lab_book_trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_trainings_all" ON public.lab_book_trainings
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Seed verisi ──────────────────────────────────────────────────────────────
INSERT INTO public.lab_book_mof_categories (name, position) VALUES
  ('CALF-20',     0),
  ('CPO-27-Ni',   1),
  ('HKUST-1',     2),
  ('CAU-1',       3),
  ('UiO-66',      4),
  ('UiO-66-NH2',  5),
  ('ZIF-8',       6),
  ('MIL-53(Al)',  7);

INSERT INTO public.lab_book_shaping_variants (mof_category_id, name, position)
SELECT c.id, v.name, v.pos
FROM public.lab_book_mof_categories c
CROSS JOIN (VALUES ('Pellet', 0), ('Granül', 1), ('Film', 2), ('Monolit', 3)) AS v(name, pos);
