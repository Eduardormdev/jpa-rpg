ALTER TABLE public.story_books
  ADD COLUMN IF NOT EXISTS summary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.story_pages
  ADD COLUMN IF NOT EXISTS category text;