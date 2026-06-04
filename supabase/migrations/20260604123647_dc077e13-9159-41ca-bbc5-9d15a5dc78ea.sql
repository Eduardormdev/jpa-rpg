CREATE TABLE public.story_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'BookOpen',
  cover_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.story_books TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_books TO authenticated;
GRANT ALL ON public.story_books TO service_role;

ALTER TABLE public.story_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read story_books" ON public.story_books FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert story_books" ON public.story_books FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update story_books" ON public.story_books FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete story_books" ON public.story_books FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.story_books (slug, title, description, icon, position) VALUES
  ('mestre', 'Livro do Mestre', 'Crônicas, segredos e bastidores das mesas conduzidas pela HUB JPA.', 'BookOpen', 0),
  ('jogador', 'Livro do Jogador', 'Aventuras vividas, personagens marcantes e momentos memoráveis dos heróis.', 'Swords', 1),
  ('monstros', 'Livro dos Monstros', 'Bestiário ilustrado das criaturas que cruzaram nossas campanhas.', 'Skull', 2);

-- Remove the slug CHECK constraint on story_pages so new books can be added
ALTER TABLE public.story_pages DROP CONSTRAINT IF EXISTS story_pages_book_check;