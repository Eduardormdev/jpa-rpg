import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Save, Play, Pencil, Type, FormInput, Activity, Heart, StickyNote, Minus, Image as ImageIcon, Dices, Palette } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_LAYOUT, PRESETS, newBlock, type Block, type BlockType, type SheetLayout, type SheetTheme, type SheetValues } from "@/lib/sheets/types";
import { SheetCanvas } from "@/components/sheet/SheetCanvas";
import { Inspector } from "@/components/sheet/Inspector";

export const Route = createFileRoute("/fichas/$sheetId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Editor de Ficha — HUB JPA" }] }),
  component: SheetEditorPage,
});

const PALETTE: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "heading", label: "Título", icon: Type },
  { type: "field", label: "Campo", icon: FormInput },
  { type: "attribute", label: "Atributo", icon: Activity },
  { type: "bar", label: "Barra", icon: Heart },
  { type: "notes", label: "Notas", icon: StickyNote },
  { type: "divider", label: "Divisor", icon: Minus },
  { type: "image", label: "Imagem", icon: ImageIcon },
  { type: "dice", label: "Dados", icon: Dices },
];

function SheetEditorPage() {
  const { sheetId } = useParams({ from: "/fichas/$sheetId" });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [system, setSystem] = useState("generico");
  const [layout, setLayout] = useState<SheetLayout>(DEFAULT_LAYOUT);
  const [values, setValues] = useState<SheetValues>({});
  const [theme, setTheme] = useState<SheetTheme>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { navigate({ to: "/login" }); return; }
      const { data, error } = await supabase.from("character_sheets").select("*").eq("id", sheetId).single();
      if (error || !data) { toast.error("Ficha não encontrada."); navigate({ to: "/fichas" }); return; }
      setTitle(data.title);
      setSystem(data.system);
      setLayout((data.layout as SheetLayout | null) ?? DEFAULT_LAYOUT);
      setValues((data.values as SheetValues | null) ?? {});
      setTheme((data.theme as SheetTheme | null) ?? {});
      setLoading(false);
    })();
  }, [sheetId, navigate]);

  // auto-save debounce
  useEffect(() => {
    if (loading) return;
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase.from("character_sheets").update({ title, system, layout: layout as never, values: values as never, theme: theme as never }).eq("id", sheetId);
      setSaving(false);
      if (error) toast.error("Falha ao salvar: " + error.message); else dirtyRef.current = false;
    }, 900);
    return () => clearTimeout(t);
  }, [title, system, layout, values, theme, loading, sheetId]);

  function markDirty() { dirtyRef.current = true; }

  function addBlock(type: BlockType) {
    const maxY = layout.blocks.reduce((m, b) => Math.max(m, b.y + b.h), 0);
    const b = newBlock(type, { y: maxY });
    setLayout((l) => ({ ...l, blocks: [...l.blocks, b] }));
    setSelectedId(b.id);
    markDirty();
  }

  function updateBlocks(blocks: Block[]) { setLayout((l) => ({ ...l, blocks })); markDirty(); }

  function patchBlock(id: string, patch: Partial<Block>) {
    setLayout((l) => ({ ...l, blocks: l.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
    markDirty();
  }

  function onValueChange(bind: string, v: unknown) {
    setValues((vals) => ({ ...vals, [bind]: v }));
    markDirty();
  }

  const selected = useMemo(() => layout.blocks.find((b) => b.id === selectedId) ?? null, [layout.blocks, selectedId]);
  const preset = PRESETS.find((p) => p.id === theme.preset);
  const canvasBg = preset?.bg ?? theme.bg ?? "linear-gradient(135deg,#1a0b2e,#0d0420)";

  if (loading) {
    return <div className="min-h-screen bg-background grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-24" />

      {/* Top bar */}
      <div className="sticky top-20 z-30 mx-auto max-w-[1400px] px-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/80 backdrop-blur px-3 py-2 shadow-card">
          <Link to="/fichas" className="grid h-9 w-9 place-items-center rounded-md border border-border hover:bg-secondary" title="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            className="flex-1 bg-transparent font-display tracking-widest text-lg focus:outline-none px-2"
          />
          <select
            value={system}
            onChange={(e) => { setSystem(e.target.value); markDirty(); }}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            <option value="generico">Genérico</option>
            <option value="dnd5e">D&D 5e</option>
            <option value="tormenta20">Tormenta 20</option>
            <option value="coc">Call of Cthulhu</option>
            <option value="custom">Custom</option>
          </select>
          <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1 px-2">
            {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Salvando</> : dirtyRef.current ? "Alterações..." : "Salvo"}
          </div>
          <button
            onClick={() => setPlayMode((p) => !p)}
            className="inline-flex items-center gap-2 rounded-md bg-accent-gradient px-3 py-2 font-display tracking-widest text-xs text-primary-foreground shadow-glow"
          >
            {playMode ? <><Pencil className="h-3.5 w-3.5" /> Editar</> : <><Play className="h-3.5 w-3.5" /> Jogar</>}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 mt-4 grid gap-4" style={{ gridTemplateColumns: playMode ? "1fr" : "220px 1fr 280px" }}>
        {!playMode && (
          <aside className="rounded-xl border border-border bg-card/60 backdrop-blur p-3 h-fit sticky top-44">
            <h3 className="font-display text-xs tracking-widest text-accent uppercase px-1 mb-2">Blocos</h3>
            <div className="grid grid-cols-2 gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p.type}
                  onClick={() => addBlock(p.type)}
                  className="flex flex-col items-center gap-1 rounded-md border border-border bg-background/60 p-2 hover:border-accent hover:text-accent transition"
                  title={`Adicionar ${p.label}`}
                >
                  <p.icon className="h-4 w-4" />
                  <span className="text-[0.65rem] tracking-widest uppercase">{p.label}</span>
                </button>
              ))}
            </div>

            <h3 className="font-display text-xs tracking-widest text-accent uppercase px-1 mt-5 mb-2 flex items-center gap-1"><Palette className="h-3 w-3" /> Tema</h3>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setTheme((t) => ({ ...t, preset: p.id })); markDirty(); }}
                  className={`relative rounded-md border p-1 h-12 overflow-hidden ${theme.preset === p.id ? "border-accent ring-2 ring-accent" : "border-border"}`}
                  style={{ background: p.bg }}
                  title={p.label}
                >
                  <span className="absolute bottom-0.5 left-1 text-[0.6rem] tracking-widest text-white drop-shadow">{p.label}</span>
                </button>
              ))}
              <button
                onClick={() => { setTheme({}); markDirty(); }}
                className="rounded-md border border-border p-1 h-12 text-[0.65rem] text-muted-foreground hover:border-accent"
              >
                Padrão
              </button>
            </div>
          </aside>
        )}

        <div className="min-w-0">
          <div className="rounded-2xl p-4 md:p-6" style={{ background: canvasBg }}>
            <SheetCanvas
              layout={layout}
              values={values}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdate={updateBlocks}
              onValueChange={onValueChange}
              playMode={playMode}
            />
          </div>
        </div>

        {!playMode && (
          <aside className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 h-fit sticky top-44">
            {selected ? (
              <Inspector block={selected} onChange={(patch) => patchBlock(selected.id, patch)} />
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="font-display text-xs tracking-widest text-accent uppercase mb-2">Inspector</p>
                Selecione um bloco para editar. Use a paleta à esquerda para adicionar novos.
              </div>
            )}
            <button
              onClick={async () => {
                setSaving(true);
                const { error } = await supabase.from("character_sheets").update({ title, system, layout: layout as never, values: values as never, theme: theme as never }).eq("id", sheetId);
                setSaving(false);
                if (error) toast.error(error.message); else { dirtyRef.current = false; toast.success("Ficha salva."); }
              }}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-md bg-accent-gradient px-3 py-2 font-display tracking-widest text-xs text-primary-foreground shadow-glow"
            >
              <Save className="h-3.5 w-3.5" /> Salvar agora
            </button>
          </aside>
        )}
      </div>
      <div className="h-16" />
    </div>
  );
}
