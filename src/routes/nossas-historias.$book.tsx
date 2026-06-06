import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Trash2, Upload, Loader2, Settings, X, ListOrdered } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/nossas-historias/$book")({
  ssr: false,
  head: () => ({ meta: [{ title: "Livro — HUB JPA" }, { name: "description", content: "Folheie nossas histórias página por página." }] }),
  component: BookViewer,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-hero text-center px-6">
      <div>
        <h1 className="font-display text-3xl tracking-widest">Livro não encontrado</h1>
        <Link to="/nossas-historias" className="mt-4 inline-block text-accent hover:underline">Voltar à biblioteca</Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center bg-hero text-center px-6">
      <div>
        <h1 className="font-display text-3xl tracking-widest">Erro ao abrir o livro</h1>
        <Link to="/nossas-historias" className="mt-4 inline-block text-accent hover:underline">Voltar à biblioteca</Link>
      </div>
    </div>
  ),
});

type Page = { id: string; book: string; position: number; type: "image" | "pdf"; url: string; title: string | null; category: string | null; _signed?: string };
type BookRow = { id: string; title: string; summary: string; categories: string[] };

function BookViewer() {
  const { book } = useParams({ from: "/nossas-historias/$book" });
  const [bookRow, setBookRow] = useState<BookRow | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState<"next" | "prev" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data: row } = await supabase.from("story_books").select("id,title,summary,categories").eq("slug", book).maybeSingle();
    if (row) setBookRow(row as BookRow);
    const { data } = await supabase.from("story_pages").select("*").eq("book", book).order("position", { ascending: true });
    const list = (data ?? []) as Page[];
    for (const p of list) {
      const { data: signed } = await supabase.storage.from("story-pages").createSignedUrl(p.url, 60 * 60 * 6);
      p._signed = signed?.signedUrl ?? "";
    }
    setPages(list);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
        setIsAdmin(roles?.some((r) => r.role === "admin") ?? false);
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  function flip(dir: "next" | "prev") {
    if (flipping) return;
    const next = dir === "next" ? index + 1 : index - 1;
    if (next < 0 || next >= pages.length) return;
    setFlipping(dir);
    setTimeout(() => { setIndex(next); setFlipping(null); }, 600);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf";
    const isImg = file.type.startsWith("image/");
    if (!isPdf && !isImg) { toast.error("Envie uma imagem ou PDF."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${book}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("story-pages").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const nextPos = pages.length > 0 ? Math.max(...pages.map((p) => p.position)) + 1 : 0;
      const { error: dbErr } = await supabase.from("story_pages").insert({
        book, position: nextPos, type: isPdf ? "pdf" : "image", url: path, title: file.name,
      });
      if (dbErr) throw dbErr;
      toast.success("Folha adicionada.");
      await load();
      setIndex(nextPos);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(p: Page) {
    if (!confirm("Remover esta folha?")) return;
    await supabase.storage.from("story-pages").remove([p.url]);
    await supabase.from("story_pages").delete().eq("id", p.id);
    toast.success("Folha removida.");
    setIndex((i) => Math.max(0, i - 1));
    await load();
  }

  async function updatePageCategory(p: Page, category: string) {
    await supabase.from("story_pages").update({ category: category || null }).eq("id", p.id);
    await load();
  }

  const current = pages[index];

  return (
    <div className="fixed inset-0 z-50 bg-hero overflow-auto">
      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between gap-4">
        <Link to="/nossas-historias" className="inline-flex items-center gap-2 font-display tracking-widest text-sm hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Biblioteca
        </Link>
        <h1 className="font-display text-xl md:text-2xl tracking-widest text-glow truncate">{bookRow?.title ?? "Livro"}</h1>
        <div className="flex items-center gap-2">
          {(bookRow?.summary || (bookRow?.categories?.length ?? 0) > 0) && (
            <button onClick={() => setShowSummary(true)} className="grid h-9 w-9 place-items-center rounded-full border border-accent/40 text-accent hover:bg-accent/10" title="Sumário">
              <ListOrdered className="h-4 w-4" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowSettings(true)} className="grid h-9 w-9 place-items-center rounded-full border border-accent/40 text-accent hover:bg-accent/10" title="Configurações do livro">
              <Settings className="h-4 w-4" />
            </button>
          )}
          <div className="w-20 text-right text-xs text-muted-foreground">
            {pages.length > 0 ? `${index + 1} / ${pages.length}` : ""}
          </div>
        </div>
      </header>

      <main className="min-h-full pt-24 pb-16 px-4 md:px-10 flex flex-col items-center">
        <div className="relative w-full max-w-5xl aspect-[3/4] md:aspect-[4/3] [perspective:2400px]">
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#2a1647] to-[#0f0820] border border-accent/40 shadow-[0_30px_80px_-20px_rgba(168,85,247,0.4)]">
            <div className="absolute left-1/2 top-2 bottom-2 w-1 -translate-x-1/2 bg-black/50 rounded-full pointer-events-none hidden md:block" />
          </div>

          <div className="absolute inset-3 md:inset-5 rounded-sm bg-[#f6efe1] text-[#2a1a05] overflow-hidden shadow-inner">
            {loading ? (
              <div className="h-full grid place-items-center text-[#2a1a05]/60">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : pages.length === 0 ? (
              <EmptyState isAdmin={isAdmin} onAdd={() => fileRef.current?.click()} uploading={uploading} />
            ) : (
              <div
                key={current?.id}
                className={`relative h-full w-full origin-left transition-transform duration-[600ms] [transform-style:preserve-3d] ${
                  flipping === "next" ? "[transform:rotateY(-160deg)]" : flipping === "prev" ? "[transform:rotateY(20deg)]" : ""
                }`}
              >
                <PageContent page={current} />
                {isAdmin && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-3 right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
                    title="Adicionar nova folha"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {pages.length > 0 && (
            <>
              <button
                onClick={() => flip("prev")}
                disabled={index === 0 || !!flipping}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:-translate-x-full grid h-12 w-12 place-items-center rounded-full bg-accent text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-30"
                aria-label="Folha anterior"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() => flip("next")}
                disabled={index >= pages.length - 1 || !!flipping}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:translate-x-full grid h-12 w-12 place-items-center rounded-full bg-accent text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-30"
                aria-label="Próxima folha"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>

        {isAdmin && pages.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {bookRow && bookRow.categories.length > 0 && current && (
              <select
                value={current.category ?? ""}
                onChange={(e) => updatePageCategory(current, e.target.value)}
                className="rounded-md border border-accent/40 bg-card px-3 py-2 text-sm"
              >
                <option value="">Sem categoria</option>
                {bookRow.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {current && (
              <button
                onClick={() => remove(current)}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/60 px-4 py-2 font-display tracking-widest text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Remover folha atual
              </button>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onPick} className="hidden" />
      </main>

      {showSummary && bookRow && (
        <SummaryModal
          book={bookRow}
          pages={pages}
          onClose={() => setShowSummary(false)}
          onJump={(i) => { setIndex(i); setShowSummary(false); }}
        />
      )}

      {showSettings && bookRow && isAdmin && (
        <BookSettingsModal
          book={bookRow}
          onClose={() => setShowSettings(false)}
          onSaved={async () => { await load(); }}
        />
      )}
    </div>
  );
}

function PageContent({ page }: { page: Page }) {
  if (!page?._signed) return <div className="h-full grid place-items-center text-[#2a1a05]/60">Carregando folha...</div>;
  if (page.type === "image") {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 bg-[#f6efe1]">
        <img src={page._signed} alt={page.title ?? "Folha"} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }
  return <iframe src={page._signed} title={page.title ?? "Folha PDF"} className="h-full w-full bg-white" />;
}

function EmptyState({ isAdmin, onAdd, uploading }: { isAdmin: boolean; onAdd: () => void; uploading: boolean }) {
  return (
    <div className="h-full grid place-items-center text-center px-8">
      <div>
        <p className="font-display tracking-widest text-2xl text-[#2a1a05]">Esta história está sendo escrita…</p>
        <p className="mt-3 text-sm text-[#2a1a05]/70 max-w-md mx-auto">
          Os escribas da HUB JPA ainda trabalham neste tomo. Volte em breve para acompanhar os próximos capítulos.
        </p>
        {isAdmin && (
          <button
            onClick={onAdd}
            disabled={uploading}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-purple-700 px-5 py-2.5 font-display tracking-widest text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Adicionar primeira folha
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryModal({ book, pages, onClose, onJump }: { book: BookRow; pages: Page[]; onClose: () => void; onJump: (i: number) => void }) {
  const grouped: Record<string, { p: Page; i: number }[]> = {};
  pages.forEach((p, i) => {
    const k = p.category ?? "Sem categoria";
    (grouped[k] ??= []).push({ p, i });
  });
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-xl p-6 shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl tracking-widest">Sumário</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {book.summary && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{book.summary}</p>}
        <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="font-display tracking-widest text-xs text-accent">{cat}</p>
              <ul className="mt-2 space-y-1">
                {items.map(({ p, i }) => (
                  <li key={p.id}>
                    <button onClick={() => onJump(i)} className="text-left text-sm hover:text-accent">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>{p.title ?? "Folha sem título"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {pages.length === 0 && <p className="text-sm text-muted-foreground">Sem folhas ainda.</p>}
        </div>
      </div>
    </div>
  );
}

function BookSettingsModal({ book, onClose, onSaved }: { book: BookRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const [summary, setSummary] = useState(book.summary ?? "");
  const [categoriesText, setCategoriesText] = useState((book.categories ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const categories = categoriesText.split(",").map((c) => c.trim()).filter(Boolean);
      const { error } = await supabase.from("story_books").update({
        summary, categories, updated_at: new Date().toISOString(),
      }).eq("id", book.id);
      if (error) throw error;
      toast.success("Configurações salvas.");
      await onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6 shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl tracking-widest">Configurações do livro</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="font-display text-xs tracking-widest text-muted-foreground">Sumário / Sinopse</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="Uma breve descrição que aparece no topo do sumário…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="font-display text-xs tracking-widest text-muted-foreground">Categorias (separadas por vírgula)</label>
            <input
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              placeholder="ex: Prólogo, Capítulo I, Apêndice"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
            <p className="mt-2 text-xs text-muted-foreground">Depois de salvar, cada folha pode ser atribuída a uma destas categorias.</p>
          </div>
          <button onClick={save} disabled={saving} className="w-full rounded-md bg-accent-gradient px-5 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
