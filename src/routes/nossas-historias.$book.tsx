import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, ArrowLeft, Plus, Trash2, Upload, Loader2,
  Settings, X, ListOrdered, Maximize2, Minimize2, ZoomIn, ZoomOut, BookOpen,
} from "lucide-react";
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

type LayoutMode = "single" | "double" | "scroll-v" | "scroll-h";
type ThemeMode = "light" | "dark" | "parchment" | "grimoire";

type Prefs = {
  layout: LayoutMode;
  theme: ThemeMode;
  flip: boolean;
  showNumbers: boolean;
  showProgress: boolean;
  hideUI: boolean;
  zoom: number; // 0.5 - 1.5
  autoSave: boolean;
};

const DEFAULT_PREFS: Prefs = {
  layout: "double",
  theme: "parchment",
  flip: true,
  showNumbers: true,
  showProgress: true,
  hideUI: false,
  zoom: 1,
  autoSave: true,
};

const THEMES: Record<ThemeMode, { paper: string; ink: string; muted: string; label: string }> = {
  light:     { paper: "#ffffff", ink: "#111111", muted: "#666666", label: "Claro" },
  dark:      { paper: "#0f0f12", ink: "#f2f2f2", muted: "#9aa0a6", label: "Escuro" },
  parchment: { paper: "#f6efe1", ink: "#2a1a05", muted: "#6b5530", label: "Pergaminho" },
  grimoire:  { paper: "#15101f", ink: "#e8d39a", muted: "#a88a44", label: "Grimório" },
};

function loadPrefs(book: string): Prefs {
  try {
    const raw = localStorage.getItem(`book-prefs:${book}`);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}
function savePrefs(book: string, p: Prefs) {
  try { localStorage.setItem(`book-prefs:${book}`, JSON.stringify(p)); } catch { /* ignore */ }
}

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
  const [showPrefs, setShowPrefs] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrefs(loadPrefs(book));
    try {
      const pos = localStorage.getItem(`book-pos:${book}`);
      if (pos) setIndex(parseInt(pos, 10) || 0);
    } catch { /* ignore */ }
  }, [book]);

  useEffect(() => {
    savePrefs(book, prefs);
  }, [book, prefs]);

  useEffect(() => {
    if (prefs.autoSave) {
      try { localStorage.setItem(`book-pos:${book}`, String(index)); } catch { /* ignore */ }
    }
  }, [index, book, prefs.autoSave]);

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

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") flip("next");
      else if (e.key === "ArrowLeft") flip("prev");
      else if (e.key === "Escape" && fullscreen) toggleFullscreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  function step() { return prefs.layout === "double" ? 2 : 1; }

  function flip(dir: "next" | "prev") {
    if (prefs.layout === "scroll-v" || prefs.layout === "scroll-h") return;
    if (flipping) return;
    const s = step();
    const next = dir === "next" ? index + s : index - s;
    if (next < 0 || next >= pages.length) return;
    if (prefs.flip) {
      setFlipping(dir);
      setTimeout(() => { setIndex(next); setFlipping(null); }, 500);
    } else {
      setIndex(next);
    }
  }

  function jumpTo(i: number) {
    const target = prefs.layout === "double" ? i - (i % 2) : i;
    setIndex(target);
    if (prefs.layout === "scroll-v" || prefs.layout === "scroll-h") {
      setTimeout(() => {
        const el = document.getElementById(`page-${i}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }, 50);
    }
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
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

  const theme = THEMES[prefs.theme];
  const current = pages[index];
  const nextPage = prefs.layout === "double" ? pages[index + 1] : undefined;
  const progress = pages.length ? Math.min(100, ((index + step()) / pages.length) * 100) : 0;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 overflow-auto" style={{ background: prefs.theme === "grimoire" ? "linear-gradient(135deg,#0c0815,#1a0f2e)" : "var(--hero, #0f0820)" }}>
      {!prefs.hideUI && (
        <header className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent">
          <Link to="/nossas-historias" className="inline-flex items-center gap-2 font-display tracking-widest text-xs md:text-sm hover:text-accent text-white">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Biblioteca</span>
          </Link>
          <h1 className="font-display text-base md:text-2xl tracking-widest text-glow truncate text-white">{bookRow?.title ?? "Livro"}</h1>
          <div className="flex items-center gap-1.5">
            {(bookRow?.summary || (bookRow?.categories?.length ?? 0) > 0) && (
              <IconBtn onClick={() => setShowSummary(true)} title="Sumário"><ListOrdered className="h-4 w-4" /></IconBtn>
            )}
            <IconBtn onClick={() => setShowPrefs(true)} title="Preferências de leitura"><BookOpen className="h-4 w-4" /></IconBtn>
            <IconBtn onClick={toggleFullscreen} title="Tela cheia">{fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</IconBtn>
            {isAdmin && (
              <IconBtn onClick={() => setShowSettings(true)} title="Configurações do livro"><Settings className="h-4 w-4" /></IconBtn>
            )}
            {prefs.showNumbers && (
              <div className="hidden md:block ml-2 w-20 text-right text-xs text-white/70">
                {pages.length > 0 ? `${index + 1}${prefs.layout === "double" && nextPage ? `-${index + 2}` : ""} / ${pages.length}` : ""}
              </div>
            )}
          </div>
        </header>
      )}

      {prefs.showProgress && pages.length > 0 && !prefs.hideUI && (
        <div className="absolute top-[68px] md:top-[88px] left-0 right-0 z-10 h-1 bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <main className={`min-h-full ${prefs.hideUI ? "pt-4" : "pt-20 md:pt-24"} pb-10 px-2 md:px-8`}>
        {loading ? (
          <div className="h-[70vh] grid place-items-center text-white/70"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : pages.length === 0 ? (
          <div className="max-w-3xl mx-auto rounded-md overflow-hidden" style={{ background: theme.paper, color: theme.ink, minHeight: "60vh" }}>
            <EmptyState theme={theme} isAdmin={isAdmin} onAdd={() => fileRef.current?.click()} uploading={uploading} />
          </div>
        ) : prefs.layout === "scroll-v" ? (
          <div className="mx-auto flex flex-col items-center gap-4" style={{ maxWidth: `${Math.round(900 * prefs.zoom)}px` }}>
            {pages.map((p, i) => (
              <div key={p.id} id={`page-${i}`} className="w-full rounded-sm shadow-xl overflow-hidden" style={{ background: theme.paper }}>
                {prefs.showNumbers && <div className="px-3 py-1 text-xs" style={{ color: theme.muted }}>{i + 1} / {pages.length}</div>}
                <PageContent page={p} theme={theme} />
              </div>
            ))}
          </div>
        ) : prefs.layout === "scroll-h" ? (
          <div className="overflow-x-auto">
            <div className="flex gap-4 items-start py-4 px-2" style={{ height: `${Math.round(80 * prefs.zoom)}vh` }}>
              {pages.map((p, i) => (
                <div key={p.id} id={`page-${i}`} className="h-full flex-shrink-0 rounded-sm shadow-xl overflow-hidden" style={{ background: theme.paper, aspectRatio: "3/4" }}>
                  <PageContent page={p} theme={theme} />
                  {prefs.showNumbers && <div className="px-3 py-1 text-xs text-center" style={{ color: theme.muted }}>{i + 1}</div>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // single or double
          <div className="flex flex-col items-center">
            <div
              className={`relative w-full ${prefs.layout === "double" ? "max-w-6xl" : "max-w-3xl"} [perspective:2400px]`}
              style={{ transform: `scale(${prefs.zoom})`, transformOrigin: "top center" }}
            >
              <div className={`grid ${prefs.layout === "double" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-0 rounded-md overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10`}>
                <PagePanel
                  page={current} theme={theme} flipping={flipping} side="left"
                  showNumber={prefs.showNumbers} number={index + 1} total={pages.length}
                  isAdmin={isAdmin} onRemove={() => current && remove(current)}
                />
                {prefs.layout === "double" && (
                  <PagePanel
                    page={nextPage} theme={theme} flipping={flipping} side="right"
                    showNumber={prefs.showNumbers} number={index + 2} total={pages.length}
                    isAdmin={isAdmin} onRemove={() => nextPage && remove(nextPage)}
                  />
                )}
              </div>

              {/* Spine */}
              {prefs.layout === "double" && (
                <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 bg-gradient-to-r from-black/30 via-black/60 to-black/30 pointer-events-none hidden md:block" />
              )}

              {isAdmin && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-3 right-3 z-20 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white border-2 border-white shadow-2xl ring-2 ring-emerald-700/40 hover:bg-emerald-600 disabled:opacity-50"
                  title="Adicionar nova folha"
                  aria-label="Adicionar nova folha"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-7 w-7" strokeWidth={3} />}
                </button>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <NavBtn onClick={() => flip("prev")} disabled={index === 0 || !!flipping} aria-label="Anterior"><ChevronLeft /></NavBtn>
              <div className="font-display tracking-widest text-xs text-white/70">
                {index + 1}{prefs.layout === "double" && nextPage ? `-${index + 2}` : ""} / {pages.length}
              </div>
              <NavBtn onClick={() => flip("next")} disabled={index + step() >= pages.length || !!flipping} aria-label="Próxima"><ChevronRight /></NavBtn>
            </div>

            {isAdmin && current && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {bookRow && bookRow.categories.length > 0 && (
                  <select
                    value={current.category ?? ""}
                    onChange={(e) => updatePageCategory(current, e.target.value)}
                    className="rounded-md border border-accent/40 bg-card px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Sem categoria</option>
                    {bookRow.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onPick} className="hidden" />
      </main>

      {showSummary && bookRow && (
        <SummaryModal book={bookRow} pages={pages} onClose={() => setShowSummary(false)} onJump={(i) => { jumpTo(i); setShowSummary(false); }} />
      )}
      {showPrefs && (
        <PrefsModal prefs={prefs} onChange={setPrefs} onClose={() => setShowPrefs(false)} totalPages={pages.length} onJump={(i) => jumpTo(i)} />
      )}
      {showSettings && bookRow && isAdmin && (
        <BookSettingsModal book={bookRow} onClose={() => setShowSettings(false)} onSaved={async () => { await load(); }} />
      )}
    </div>
  );
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
      {children}
    </button>
  );
}

function NavBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className="grid h-11 w-11 place-items-center rounded-full bg-accent text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-30">
      {children}
    </button>
  );
}

function PagePanel({
  page, theme, flipping, side, showNumber, number, total, isAdmin, onRemove,
}: {
  page?: Page; theme: { paper: string; ink: string; muted: string };
  flipping: "next" | "prev" | null; side: "left" | "right";
  showNumber: boolean; number: number; total: number;
  isAdmin: boolean; onRemove: () => void;
}) {
  const transform =
    flipping === "next" && side === "right" ? "rotateY(-160deg)" :
    flipping === "prev" && side === "left" ? "rotateY(160deg)" : "";
  return (
    <div
      className="relative aspect-[3/4] overflow-hidden transition-transform duration-500"
      style={{ background: theme.paper, color: theme.ink, transformOrigin: side === "right" ? "left center" : "right center", transform, transformStyle: "preserve-3d" }}
    >
      {page ? (
        <>
          <PageContent page={page} theme={theme} />
          {showNumber && (
            <div className={`absolute bottom-2 ${side === "left" ? "left-3" : "right-3"} text-[10px] font-display tracking-widest`} style={{ color: theme.muted }}>
              {number} / {total}
            </div>
          )}
          {isAdmin && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-red-600 border-2 border-red-600 shadow-lg ring-2 ring-white/80 hover:bg-red-600 hover:text-white transition-colors"
              title="Remover folha"
              aria-label="Remover folha"
            >
              <Trash2 className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </>
      ) : (
        <div className="h-full grid place-items-center" style={{ color: theme.muted }}>
          <span className="text-xs font-display tracking-widest">— fim —</span>
        </div>
      )}
    </div>
  );
}

function PageContent({ page, theme }: { page: Page; theme: { paper: string; ink: string; muted: string } }) {
  if (!page?._signed) return <div className="h-full grid place-items-center" style={{ color: theme.muted }}>Carregando folha...</div>;
  if (page.type === "image") {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <img src={page._signed} alt={page.title ?? "Folha"} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }
  return <iframe src={page._signed} title={page.title ?? "Folha PDF"} className="h-full w-full" style={{ background: theme.paper }} />;
}

function EmptyState({ theme, isAdmin, onAdd, uploading }: { theme: { paper: string; ink: string; muted: string }; isAdmin: boolean; onAdd: () => void; uploading: boolean }) {
  return (
    <div className="h-full min-h-[60vh] grid place-items-center text-center px-8">
      <div>
        <p className="font-display tracking-widest text-2xl" style={{ color: theme.ink }}>Esta história está sendo escrita…</p>
        <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: theme.muted }}>
          Os escribas da HUB JPA ainda trabalham neste tomo. Volte em breve para acompanhar os próximos capítulos.
        </p>
        {isAdmin && (
          <button onClick={onAdd} disabled={uploading} className="mt-6 inline-flex items-center gap-2 rounded-md bg-purple-700 px-5 py-2.5 font-display tracking-widest text-sm text-white hover:opacity-90 disabled:opacity-50">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Adicionar primeira folha
          </button>
        )}
      </div>
    </div>
  );
}

function PrefsModal({
  prefs, onChange, onClose, totalPages, onJump,
}: {
  prefs: Prefs; onChange: (p: Prefs) => void; onClose: () => void;
  totalPages: number; onJump: (i: number) => void;
}) {
  const [jump, setJump] = useState("");
  function set<K extends keyof Prefs>(k: K, v: Prefs[K]) { onChange({ ...prefs, [k]: v }); }
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl tracking-widest">Preferências de leitura</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 space-y-5">
          <Field label="Modo de exibição">
            <div className="grid grid-cols-2 gap-2">
              {([
                ["single", "Página única"],
                ["double", "Página dupla"],
                ["scroll-v", "Rolagem vertical"],
                ["scroll-h", "Rolagem horizontal"],
              ] as [LayoutMode, string][]).map(([v, l]) => (
                <button key={v} onClick={() => set("layout", v)} className={`rounded-md border px-3 py-2 text-sm ${prefs.layout === v ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-accent/5"}`}>{l}</button>
              ))}
            </div>
          </Field>

          <Field label="Tema visual">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as ThemeMode[]).map((k) => (
                <button key={k} onClick={() => set("theme", k)} className={`rounded-md border px-3 py-2 text-sm flex items-center gap-2 ${prefs.theme === k ? "border-accent" : "border-border"}`}>
                  <span className="h-4 w-4 rounded-sm border border-border" style={{ background: THEMES[k].paper }} />
                  {THEMES[k].label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Zoom: ${Math.round(prefs.zoom * 100)}%`}>
            <div className="flex items-center gap-2">
              <button onClick={() => set("zoom", Math.max(0.5, +(prefs.zoom - 0.1).toFixed(2)))} className="grid h-8 w-8 place-items-center rounded-md border border-border"><ZoomOut className="h-4 w-4" /></button>
              <input type="range" min={0.5} max={1.5} step={0.05} value={prefs.zoom} onChange={(e) => set("zoom", parseFloat(e.target.value))} className="flex-1" />
              <button onClick={() => set("zoom", Math.min(1.5, +(prefs.zoom + 0.1).toFixed(2)))} className="grid h-8 w-8 place-items-center rounded-md border border-border"><ZoomIn className="h-4 w-4" /></button>
            </div>
          </Field>

          <div className="space-y-2">
            <Toggle label="Efeito virar página" checked={prefs.flip} onChange={(v) => set("flip", v)} />
            <Toggle label="Mostrar numeração" checked={prefs.showNumbers} onChange={(v) => set("showNumbers", v)} />
            <Toggle label="Barra de progresso" checked={prefs.showProgress} onChange={(v) => set("showProgress", v)} />
            <Toggle label="Ocultar interface (modo foco)" checked={prefs.hideUI} onChange={(v) => set("hideUI", v)} />
            <Toggle label="Salvar última posição" checked={prefs.autoSave} onChange={(v) => set("autoSave", v)} />
          </div>

          {totalPages > 0 && (
            <Field label={`Ir para página (1 a ${totalPages})`}>
              <div className="flex gap-2">
                <input value={jump} onChange={(e) => setJump(e.target.value)} type="number" min={1} max={totalPages} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <button onClick={() => { const n = parseInt(jump, 10); if (n >= 1 && n <= totalPages) { onJump(n - 1); onClose(); } }} className="rounded-md bg-accent px-4 py-2 text-sm text-primary-foreground">Ir</button>
              </div>
            </Field>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-display text-xs tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer text-sm">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-accent" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function SummaryModal({ book, pages, onClose, onJump }: { book: BookRow; pages: Page[]; onClose: () => void; onJump: (i: number) => void }) {
  const grouped = useMemo(() => {
    const g: Record<string, { p: Page; i: number }[]> = {};
    pages.forEach((p, i) => {
      const k = p.category ?? "Sem categoria";
      (g[k] ??= []).push({ p, i });
    });
    return g;
  }, [pages]);

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
                    <button onClick={() => onJump(i)} className="text-left text-sm hover:text-accent w-full">
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
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} placeholder="Uma breve descrição que aparece no topo do sumário…" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="font-display text-xs tracking-widest text-muted-foreground">Categorias (separadas por vírgula)</label>
            <input value={categoriesText} onChange={(e) => setCategoriesText(e.target.value)} placeholder="ex: Prólogo, Capítulo I, Apêndice" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            <p className="mt-2 text-xs text-muted-foreground">Depois de salvar, cada folha pode ser atribuída a uma destas categorias.</p>
          </div>
          <button onClick={save} disabled={saving} className="w-full rounded-md bg-accent px-5 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
