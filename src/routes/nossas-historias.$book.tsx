import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Trash2, Upload, Loader2 } from "lucide-react";
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

type Page = { id: string; book: string; position: number; type: "image" | "pdf"; url: string; title: string | null; _signed?: string };

function BookViewer() {
  const { book } = useParams({ from: "/nossas-historias/$book" });
  const [bookTitle, setBookTitle] = useState<string>("Livro");
  const [pages, setPages] = useState<Page[]>([]);
  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState<"next" | "prev" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("story_pages").select("*").eq("book", book).order("position", { ascending: true });
    const list = (data ?? []) as Page[];
    // sign urls
    for (const p of list) {
      const path = p.url;
      const { data: signed } = await supabase.storage.from("story-pages").createSignedUrl(path, 60 * 60 * 6);
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

  const current = pages[index];

  return (
    <div className="min-h-screen bg-hero">
      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        <Link to="/nossas-historias" className="inline-flex items-center gap-2 font-display tracking-widest text-sm hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Biblioteca
        </Link>
        <h1 className="font-display text-xl md:text-2xl tracking-widest text-glow">{meta.title}</h1>
        <div className="w-24 text-right text-xs text-muted-foreground">
          {pages.length > 0 ? `${index + 1} / ${pages.length}` : ""}
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 md:px-10 flex flex-col items-center">
        {/* Book */}
        <div className="relative w-full max-w-4xl aspect-[3/4] md:aspect-[4/3] [perspective:2400px]">
          {/* Book base */}
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#2a1647] to-[#0f0820] border border-accent/40 shadow-[0_30px_80px_-20px_rgba(168,85,247,0.4)]">
            {/* spine */}
            <div className="absolute left-1/2 top-2 bottom-2 w-1 -translate-x-1/2 bg-black/50 rounded-full pointer-events-none hidden md:block" />
          </div>

          {/* Page area */}
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
                className={`h-full w-full origin-left transition-transform duration-[600ms] [transform-style:preserve-3d] ${
                  flipping === "next" ? "[transform:rotateY(-160deg)]" : flipping === "prev" ? "[transform:rotateY(20deg)]" : ""
                }`}
              >
                <PageContent page={current} />
              </div>
            )}
          </div>

          {/* Controls */}
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

        {/* Admin bar */}
        {isAdmin && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md bg-accent-gradient px-5 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {uploading ? "Enviando..." : "Adicionar folha (imagem ou PDF)"}
            </button>
            {current && (
              <button
                onClick={() => remove(current)}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/60 px-4 py-2.5 font-display tracking-widest text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Remover folha atual
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onPick} className="hidden" />
          </div>
        )}
      </main>
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
        <p className="font-display tracking-widest text-xl text-[#2a1a05]">Este livro ainda não tem folhas.</p>
        <p className="mt-2 text-sm text-[#2a1a05]/70">Volte em breve para acompanhar novos capítulos.</p>
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
