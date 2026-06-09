
-- 1. story_chapters
CREATE TABLE public.story_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  parent_id uuid REFERENCES public.story_chapters(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT 'Novo capítulo',
  kind text NOT NULL DEFAULT 'capitulo' CHECK (kind IN ('volume','arco','capitulo','secao')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.story_chapters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_chapters TO authenticated;
GRANT ALL ON public.story_chapters TO service_role;

ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chapters" ON public.story_chapters
  FOR SELECT USING (true);
CREATE POLICY "Admins manage chapters" ON public.story_chapters
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX story_chapters_book_idx ON public.story_chapters (book, position);
CREATE INDEX story_chapters_parent_idx ON public.story_chapters (parent_id);

-- 2. story_pages additions
ALTER TABLE public.story_pages
  ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES public.story_chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published')),
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS story_pages_chapter_idx ON public.story_pages (chapter_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS story_pages_book_slug_uniq ON public.story_pages (book, slug) WHERE slug IS NOT NULL;

-- Tighten reader policy: non-admins only see published, non-locked
DROP POLICY IF EXISTS "Anyone can read pages" ON public.story_pages;
DROP POLICY IF EXISTS "Public read pages" ON public.story_pages;
DROP POLICY IF EXISTS "Read story pages" ON public.story_pages;

CREATE POLICY "Public reads published pages" ON public.story_pages
  FOR SELECT
  USING (
    status = 'published' AND is_locked = false
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. story_page_versions
CREATE TABLE public.story_page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.story_pages(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  label text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.story_page_versions TO authenticated;
GRANT ALL ON public.story_page_versions TO service_role;

ALTER TABLE public.story_page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read versions" ON public.story_page_versions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create versions" ON public.story_page_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete versions" ON public.story_page_versions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX story_page_versions_page_idx ON public.story_page_versions (page_id, created_at DESC);

-- 4. updated_at trigger for story_chapters
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS story_chapters_touch ON public.story_chapters;
CREATE TRIGGER story_chapters_touch
  BEFORE UPDATE ON public.story_chapters
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
