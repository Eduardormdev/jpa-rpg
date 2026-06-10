
-- =========================================
-- SHEET TEMPLATES
-- =========================================
CREATE TABLE public.sheet_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  system TEXT NOT NULL DEFAULT 'generico',
  description TEXT,
  cover_url TEXT,
  layout JSONB NOT NULL DEFAULT '{"version":1,"grid":{"cols":12,"rowHeight":40},"blocks":[]}'::jsonb,
  default_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_official BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sheet_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheet_templates TO authenticated;
GRANT ALL ON public.sheet_templates TO service_role;

ALTER TABLE public.sheet_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view official or public templates"
  ON public.sheet_templates FOR SELECT
  USING (is_official = true OR is_public = true);

CREATE POLICY "Users can view their own templates"
  ON public.sheet_templates FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create their own templates"
  ON public.sheet_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_official = false);

CREATE POLICY "Users can update their own templates"
  ON public.sheet_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid() AND is_official = false);

CREATE POLICY "Users can delete their own templates"
  ON public.sheet_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins manage all templates"
  ON public.sheet_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sheet_templates_updated
  BEFORE UPDATE ON public.sheet_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_sheet_templates_system ON public.sheet_templates(system);
CREATE INDEX idx_sheet_templates_official ON public.sheet_templates(is_official) WHERE is_official = true;

-- =========================================
-- CHARACTER SHEETS
-- =========================================
CREATE TABLE public.character_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.sheet_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Nova ficha',
  system TEXT NOT NULL DEFAULT 'generico',
  cover_url TEXT,
  layout JSONB NOT NULL DEFAULT '{"version":1,"grid":{"cols":12,"rowHeight":40},"blocks":[]}'::jsonb,
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.character_sheets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.character_sheets TO authenticated;
GRANT ALL ON public.character_sheets TO service_role;

ALTER TABLE public.character_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public sheets"
  ON public.character_sheets FOR SELECT
  USING (is_public = true AND public_slug IS NOT NULL);

CREATE POLICY "Owners manage their sheets"
  ON public.character_sheets FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins manage all sheets"
  ON public.character_sheets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_character_sheets_updated
  BEFORE UPDATE ON public.character_sheets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_character_sheets_owner ON public.character_sheets(owner_id);
CREATE INDEX idx_character_sheets_public_slug ON public.character_sheets(public_slug) WHERE public_slug IS NOT NULL;

-- =========================================
-- SEED OFFICIAL TEMPLATES
-- =========================================
INSERT INTO public.sheet_templates (name, system, description, is_official, is_public, layout) VALUES
('Em branco', 'generico', 'Comece do zero, arraste blocos da paleta.', true, true,
 '{"version":1,"grid":{"cols":12,"rowHeight":40},"blocks":[]}'::jsonb),
('Genérico RPG', 'generico', 'Estrutura básica: identidade, atributos, HP, inventário e notas.', true, true,
 '{"version":1,"grid":{"cols":12,"rowHeight":40},"blocks":[
   {"id":"b1","type":"heading","x":0,"y":0,"w":12,"h":2,"props":{"text":"Personagem","level":1}},
   {"id":"b2","type":"field","x":0,"y":2,"w":6,"h":2,"props":{"label":"Nome"},"bind":"nome"},
   {"id":"b3","type":"field","x":6,"y":2,"w":3,"h":2,"props":{"label":"Classe"},"bind":"classe"},
   {"id":"b4","type":"field","x":9,"y":2,"w":3,"h":2,"props":{"label":"Nível","type":"number"},"bind":"nivel"},
   {"id":"b5","type":"bar","x":0,"y":4,"w":12,"h":2,"props":{"label":"HP","color":"#dc2626","max":20},"bind":"hp"},
   {"id":"b6","type":"notes","x":0,"y":6,"w":12,"h":6,"props":{"label":"Notas"},"bind":"notas"}
 ]}'::jsonb),
('One-page Mini', 'generico', 'Ficha enxuta para one-shots.', true, true,
 '{"version":1,"grid":{"cols":12,"rowHeight":40},"blocks":[
   {"id":"b1","type":"heading","x":0,"y":0,"w":12,"h":2,"props":{"text":"One-Shot","level":2}},
   {"id":"b2","type":"field","x":0,"y":2,"w":8,"h":2,"props":{"label":"Personagem"},"bind":"nome"},
   {"id":"b3","type":"field","x":8,"y":2,"w":4,"h":2,"props":{"label":"Conceito"},"bind":"conceito"},
   {"id":"b4","type":"bar","x":0,"y":4,"w":12,"h":2,"props":{"label":"Vitalidade","color":"#16a34a","max":10},"bind":"vida"},
   {"id":"b5","type":"notes","x":0,"y":6,"w":12,"h":6,"props":{"label":"Habilidades & Equipamento"},"bind":"livre"}
 ]}'::jsonb),
('D&D 5e Simplificado', 'dnd5e', 'Atributos, perícias e ataques essenciais.', true, true,
 '{"version":1,"grid":{"cols":12,"rowHeight":40},"blocks":[
   {"id":"h","type":"heading","x":0,"y":0,"w":12,"h":2,"props":{"text":"D&D 5e","level":1}},
   {"id":"n","type":"field","x":0,"y":2,"w":6,"h":2,"props":{"label":"Personagem"},"bind":"nome"},
   {"id":"c","type":"field","x":6,"y":2,"w":3,"h":2,"props":{"label":"Classe"},"bind":"classe"},
   {"id":"l","type":"field","x":9,"y":2,"w":3,"h":2,"props":{"label":"Nível","type":"number"},"bind":"nivel"},
   {"id":"a1","type":"attribute","x":0,"y":4,"w":2,"h":3,"props":{"label":"FOR"},"bind":"forca"},
   {"id":"a2","type":"attribute","x":2,"y":4,"w":2,"h":3,"props":{"label":"DES"},"bind":"destreza"},
   {"id":"a3","type":"attribute","x":4,"y":4,"w":2,"h":3,"props":{"label":"CON"},"bind":"constituicao"},
   {"id":"a4","type":"attribute","x":6,"y":4,"w":2,"h":3,"props":{"label":"INT"},"bind":"inteligencia"},
   {"id":"a5","type":"attribute","x":8,"y":4,"w":2,"h":3,"props":{"label":"SAB"},"bind":"sabedoria"},
   {"id":"a6","type":"attribute","x":10,"y":4,"w":2,"h":3,"props":{"label":"CAR"},"bind":"carisma"},
   {"id":"hp","type":"bar","x":0,"y":7,"w":6,"h":2,"props":{"label":"HP","color":"#dc2626","max":20},"bind":"hp"},
   {"id":"ca","type":"field","x":6,"y":7,"w":3,"h":2,"props":{"label":"CA","type":"number"},"bind":"ca"},
   {"id":"in","type":"field","x":9,"y":7,"w":3,"h":2,"props":{"label":"Iniciativa","type":"number"},"bind":"iniciativa"},
   {"id":"no","type":"notes","x":0,"y":9,"w":12,"h":6,"props":{"label":"Ataques, magias e notas"},"bind":"notas"}
 ]}'::jsonb);
