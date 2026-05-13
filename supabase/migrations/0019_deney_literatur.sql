-- Eski tabloları temizle
DROP TABLE IF EXISTS public.deney_literatur_item_links     CASCADE;
DROP TABLE IF EXISTS public.deney_literatur_item_subtasks  CASCADE;
DROP TABLE IF EXISTS public.deney_literatur_item_comments  CASCADE;
DROP TABLE IF EXISTS public.deney_literatur_item_assignees CASCADE;
DROP TABLE IF EXISTS public.deney_literatur_items          CASCADE;
DROP TABLE IF EXISTS public.deney_literatur_groups         CASCADE;

-- Gruplar tablosu
CREATE TABLE public.deney_literatur_groups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL,
  position   integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER dl_groups_set_updated_at
  BEFORE UPDATE ON public.deney_literatur_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.deney_literatur_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth groups" ON public.deney_literatur_groups FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Öge tablosu
CREATE TABLE public.deney_literatur_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid        NOT NULL REFERENCES public.deney_literatur_groups(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  notes        text,
  status       text        NOT NULL DEFAULT 'backlog'
                           CHECK (status IN ('backlog', 'todo', 'inprogress', 'completed')),
  position     integer     NOT NULL DEFAULT 0,
  due_date     date,
  tags         text[]      NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  deleted      boolean     NOT NULL DEFAULT false,
  deleted_at   timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER dl_items_set_updated_at
  BEFORE UPDATE ON public.deney_literatur_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.deney_literatur_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth items" ON public.deney_literatur_items FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Atanma tablosu
CREATE TABLE public.deney_literatur_item_assignees (
  item_id uuid REFERENCES public.deney_literatur_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, user_id)
);

ALTER TABLE public.deney_literatur_item_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth dl_assignees" ON public.deney_literatur_item_assignees FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Yorumlar tablosu
CREATE TABLE public.deney_literatur_item_comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid        NOT NULL REFERENCES public.deney_literatur_items(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deney_literatur_item_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth dl_comments" ON public.deney_literatur_item_comments FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Alt görevler tablosu
CREATE TABLE public.deney_literatur_item_subtasks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid        NOT NULL REFERENCES public.deney_literatur_items(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  completed  boolean     NOT NULL DEFAULT false,
  position   integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deney_literatur_item_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth dl_subtasks" ON public.deney_literatur_item_subtasks FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Bağlanan biletler tablosu
CREATE TABLE public.deney_literatur_item_links (
  item_id        uuid NOT NULL REFERENCES public.deney_literatur_items(id) ON DELETE CASCADE,
  linked_item_id uuid NOT NULL REFERENCES public.deney_literatur_items(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, linked_item_id),
  CHECK (item_id <> linked_item_id)
);

ALTER TABLE public.deney_literatur_item_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth dl_links" ON public.deney_literatur_item_links FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
