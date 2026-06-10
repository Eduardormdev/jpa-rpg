import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Pencil, FileText, Sparkles, Copy, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_LAYOUT } from "@/lib/sheets/types";

export const Route = createFileRoute("/fichas/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fichas Modulares — HUB JPA" },
      { name: "description", content: "Crie fichas de personagem modulares com editor visual estilo Canva." },
      { property: "og:title", content: "Fichas Modulares — HUB JPA" },
    ],
  }),
  component: FichasPage,
});

type Sheet = { id: string; title: string; system: string; updated_at: string; cover_url: string | null };
type Template = { id: string; name: string; system: string; description: string | null; cover_url: string | null; layout: unknown };

function FichasPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  async function load() {
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { setAuthed(false); setLoading(false); return; }
    setAuthed(true);
    const [s, t] = await Promise.all([
      supabase.from("character_sheets").select("id,title,system,updated_at,cover_url").order("updated_at", { ascending: false }),
      supabase.from("sheet_templates").select("id,name,system,description,cover_url,layout").or("is_official.eq.true,is_public.eq.true").order("is_official", { ascending: false }),
    ]);
    setSheets((s.data ?? []) as Sheet[]);
    setTemplates((t.data ?? []) as Template[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createFromTemplate(tpl: Template | null) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { navigate({ to: "/login" }); return; }
    const payload = {
      owner_id: sess.session.user.id,
      template_id: tpl?.id ?? null,
      title: tpl ? `${tpl.name} — sem nome` : "Nova ficha",
      system: tpl?.system ?? "generico",
      layout: (tpl?.layout ?? DEFAULT_LAYOUT) as never,
      values: {} as never,
      theme: {} as never,
    };
    const { data, error } = await supabase.from("character_sheets").insert(payload).select("id").single();
    if (error) { toast.error(error.message); return; }
    toast.success("Ficha criada.");
    navigate({ to: "/fichas/$sheetId", params: { sheetId: data.id } });
  }

  async function duplicate(s: Sheet) {
    const { data: orig } = await supabase.from("character_sheets").select("*").eq("id", s.id).single();
    if (!orig) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const { id: _id, created_at: _c, updated_at: _u, public_slug: _p, is_public: _ip, ...rest } = orig as Record<string, unknown> & { id: string; created_at: string; updated_at: string; public_slug: string | null; is_public: boolean };
    void _id; void _c; void _u; void _p; void _ip;
    const { error } = await supabase.from("character_sheets").insert({ ...rest, owner_id: sess.session.user.id, title: `${s.title} (cópia)`, is_public: false, public_slug: null });
    if (error) toast.error(error.message); else { toast.success("Ficha duplicada."); load(); }
  }

  async function remove(s: Sheet) {
    if (!confirm(`Excluir a ficha "${s.title}"?`)) return;
    const { error } = await supabase.from("character_sheets").delete().eq("id", s.id);
    if (error) toast.error(error.message); else { toast.success("Excluída."); load(); }
  }

  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pt-36 pb-24">
        <header className="text-center">
          <p className="font-display tracking-[0.4em] text-accent text-sm">SUAS FICHAS</p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl tracking-widest text-glow">Fichas Modulares</h1>
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground">
            Monte fichas de personagem como em um canvas — arraste blocos, escolha um template e leve para a mesa.
          </p>
        </header>

        {!authed && !loading && (
          <div className="mt-16 mx-auto max-w-md text-center rounded-2xl border border-border bg-card/60 backdrop-blur p-8">
            <Sparkles className="h-8 w-8 mx-auto text-accent" />
            <h2 className="mt-3 font-display text-xl tracking-widest">Entre para criar fichas</h2>
            <p className="mt-2 text-sm text-muted-foreground">As fichas ficam salvas na sua conta.</p>
            <Link to="/login" className="mt-5 inline-flex rounded-md bg-accent-gradient px-6 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow">
              Entrar
            </Link>
          </div>
        )}

        {loading && (
          <div className="mt-20 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        )}

        {authed && !loading && (
          <>
            {/* Suas fichas */}
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl tracking-widest">Minhas fichas</h2>
                <button
                  onClick={() => createFromTemplate(null)}
                  className="inline-flex items-center gap-2 rounded-md bg-accent-gradient px-4 py-2 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Nova ficha em branco
                </button>
              </div>

              {sheets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
                  Nenhuma ficha ainda. Use um template abaixo ou crie em branco.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sheets.map((s) => (
                    <div key={s.id} className="group relative rounded-xl border border-border bg-card/60 backdrop-blur p-5 hover:border-accent transition-colors">
                      <Link to="/fichas/$sheetId" params={{ sheetId: s.id }} className="block">
                        <div className="flex items-start gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent-gradient shadow-glow shrink-0">
                            <FileText className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display text-lg tracking-wider truncate">{s.title}</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{s.system}</p>
                            <p className="text-xs text-muted-foreground mt-1">Atualizada {new Date(s.updated_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Link>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => duplicate(s)} className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border hover:bg-accent hover:text-primary-foreground" title="Duplicar">
                          <Copy className="h-4 w-4" />
                        </button>
                        <Link to="/fichas/$sheetId" params={{ sheetId: s.id }} className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border hover:bg-accent hover:text-primary-foreground" title="Abrir">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => remove(s)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-600 border-2 border-red-600 shadow-lg" title="Excluir">
                          <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Templates */}
            <section className="mt-20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl tracking-widest">Modelos prontos</h2>
                <span className="text-xs text-muted-foreground">Use como ponto de partida</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => createFromTemplate(t)}
                    className="group text-left rounded-xl border border-border bg-card/60 backdrop-blur p-5 hover:border-accent transition-colors"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-glow">
                      <ExternalLink className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 font-display text-lg tracking-wider">{t.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{t.system}</p>
                    {t.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{t.description}</p>}
                    <span className="mt-4 inline-flex items-center gap-2 text-xs text-accent font-display tracking-widest">
                      <Plus className="h-3 w-3" /> Criar ficha
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
