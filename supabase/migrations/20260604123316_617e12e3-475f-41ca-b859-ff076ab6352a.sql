CREATE TABLE public.story_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL CHECK (book IN ('mestre','jogador','monstros')),
  position integer NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('image','pdf')),
  url text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.story_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_pages TO authenticated;
GRANT ALL ON public.story_pages TO service_role;

ALTER TABLE public.story_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read story pages" ON public.story_pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert story pages" ON public.story_pages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update story pages" ON public.story_pages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete story pages" ON public.story_pages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX story_pages_book_position_idx ON public.story_pages (book, position);