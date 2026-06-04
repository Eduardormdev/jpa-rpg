import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Swords, Skull, Scroll, Sparkles, Crown, Wand2, Shield, Plus, Pencil, Trash2, Loader2, X, Upload } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/nossas-historias")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nossas Histórias — HUB JPA" },
      { name: "description", content: "Os livros do Mestre, do Jogador e dos Monstros. Folheie as histórias da HUB JPA." },
      { property: "og:title", content: "Nossas Histórias — HUB JPA" },
      { property: "og:description", content: "Folheie os livros do Mestre, do Jogador e dos Monstros." },
    ],
  }),
  component: NossasHistoriasPage,
});

type Book = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  cover_url: string | null;
  position: number;
  _coverSigned?: string;
};

const ICON_MAP: Record<string, typeof BookOpen> = {
  BookOpen, Swords, Skull, Scroll, Sparkles, Crown, Wand2, Shield,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

function NossasHistoriasPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Book | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("story_books").select("*").order("position", { ascending: true });
    const list = (data ?? []) as Book[];
    for (const b of list) {
      if (b.cover_url) {
        const { data: s } = await supabase.storage.from("story-pages").createSignedUrl(b.cover_url, 60 * 60 * 6);
        b._coverSigned = s?.signedUrl ?? "";
      }
    }
    setBooks(list);
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
  }, []);

  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pt-36 pb-24">
        <header className="text-center">
          <p className="font-display tracking-[0.4em] text-accent text-sm">A BIBLIOTECA</p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl tracking-widest text-glow">Nossas Histórias</h1>
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground">
            Escolha um dos tomos sagrados. Cada livro guarda capítulos vivos da HUB JPA — folheie página por página.
          </p>
        </header>

        {loading ? (
          <div className="mt-20 grid place-items-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((b) => (
              <BookCard key={b.id} book={b} isAdmin={isAdmin} onEdit={() => setEditing(b)} onReload={load} />
            ))}
            {isAdmin && (
              <button
                onClick={() => setCreating(true)}
                className="group relative flex flex-col items-center text-center"
              >
                <div className="relative w-full max-w-[16rem] mx-auto aspect-[3/4] rounded-r-md rounded-l-sm border-2 border-dashed border-accent/50 bg-card/30 flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent transition-colors">
                  <div className="text-center text-accent">
                    <Plus className="h-16 w-16 mx-auto" strokeWidth={1.5} />
                    <p className="mt-3 font-display tracking-widest text-sm">Novo livro</p>
                  </div>
                </div>
                <h2 className="mt-6 font-display text-lg tracking-widest text-muted-foreground">Adicionar tomo</h2>
              </button>
            )}
          </div>
        )}
      </main>
      <SiteFooter />

      {editing && <BookFormModal book={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {creating && <BookFormModal book={null} onClose={() => setCreating(false)} onSaved={load} />}
    </div>
  );
}

function BookCard({ book, isAdmin, onEdit, onReload }: { book: Book; isAdmin: boolean; onEdit: () => void; onReload: () => void }) {
  const Icon = ICON_MAP[book.icon] ?? BookOpen;

  async function remove(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm(`Remover o livro "${book.title}"? As folhas vinculadas precisam ser removidas separadamente.`)) return;
    if (book.cover_url) await supabase.storage.from("story-pages").remove([book.cover_url]);
    const { error } = await supabase.from("story_books").delete().eq("id", book.id);
    if (error) toast.error("Erro ao remover."); else { toast.success("Livro removido."); onReload(); }
  }

  return (
    <div className="relative group">
      <Link to="/nossas-historias/$book" params={{ book: book.slug }} className="block text-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-br from-purple-700 to-fuchsia-500 rounded-full group-hover:opacity-70 transition-opacity" />
          <div className="relative w-full max-w-[16rem] mx-auto aspect-[3/4] rounded-r-md rounded-l-sm bg-gradient-to-br from-[#2a1647] to-[#1a0b2e] border border-accent/40 shadow-glow overflow-hidden transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105">
            <div className="absolute left-2 top-0 bottom-0 w-2 bg-black/40 rounded-l-sm z-10" />
            {book._coverSigned ? (
              <img src={book._coverSigned} alt={book.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-3 border border-accent/30 rounded-sm flex items-center justify-center">
                <Icon className="h-20 w-20 text-accent drop-shadow-[0_0_20px_hsl(var(--accent)/0.8)]" strokeWidth={1.2} />
              </div>
            )}
          </div>
        </div>
        <h2 className="mt-6 font-display text-xl tracking-widest text-glow">{book.title}</h2>
        <p className="mt-2 max-w-xs mx-auto text-sm text-muted-foreground line-clamp-3">{book.description}</p>
      </Link>
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.preventDefault(); onEdit(); }} className="grid h-8 w-8 place-items-center rounded-full bg-accent text-primary-foreground shadow-glow hover:opacity-90" title="Editar capa">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={remove} className="grid h-8 w-8 place-items-center rounded-full bg-destructive text-white hover:opacity-90" title="Remover livro">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function BookFormModal({ book, onClose, onSaved }: { book: Book | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [slug, setSlug] = useState(book?.slug ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [icon, setIcon] = useState(book?.icon ?? "BookOpen");
  const [coverPath, setCoverPath] = useState<string | null>(book?.cover_url ?? null);
  const [preview, setPreview] = useState<string | undefined>(book?._coverSigned);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("story-pages").upload(path, file, { contentType: file.type });
      if (error) throw error;
      // remove old cover
      if (coverPath && coverPath !== path) await supabase.storage.from("story-pages").remove([coverPath]);
      setCoverPath(path);
      const { data: s } = await supabase.storage.from("story-pages").createSignedUrl(path, 60 * 60 * 6);
      setPreview(s?.signedUrl);
      toast.success("Capa enviada.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro no upload.");
    } finally { setUploading(false); }
  }

  async function save() {
    if (!title.trim() || !slug.trim()) { toast.error("Título e identificador são obrigatórios."); return; }
    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    setSaving(true);
    try {
      if (book) {
        const { error } = await supabase.from("story_books").update({
          title, slug: normalizedSlug, description, icon, cover_url: coverPath, updated_at: new Date().toISOString(),
        }).eq("id", book.id);
        if (error) throw error;
        toast.success("Livro atualizado.");
      } else {
        const { error } = await supabase.from("story_books").insert({
          title, slug: normalizedSlug, description, icon, cover_url: coverPath, position: Date.now() % 100000,
        });
        if (error) throw error;
        toast.success("Livro criado.");
      }
      onSaved(); onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6 shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl tracking-widest">{book ? "Editar livro" : "Novo livro"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-28 aspect-[3/4] rounded-sm bg-gradient-to-br from-[#2a1647] to-[#1a0b2e] border border-accent/40 overflow-hidden grid place-items-center">
              {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-8 w-8 text-accent/60" />}
            </div>
            <div className="flex-1">
              <label className="font-display text-xs tracking-widest text-muted-foreground">Capa do livro</label>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md border border-accent px-3 py-2 text-sm text-accent hover:bg-accent/10 disabled:opacity-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : preview ? "Trocar capa" : "Enviar capa"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickCover} className="hidden" />
              <p className="mt-2 text-xs text-muted-foreground">Sem capa, o ícone abaixo é exibido.</p>
            </div>
          </div>
          <Field label="Título" value={title} onChange={setTitle} />
          <Field label="Identificador (slug, na URL)" value={slug} onChange={setSlug} placeholder="ex: artefatos" />
          <div>
            <label className="font-display text-xs tracking-widest text-muted-foreground">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="font-display text-xs tracking-widest text-muted-foreground">Ícone (usado quando não há capa)</label>
            <select value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
              {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button onClick={save} disabled={saving} className="w-full rounded-md bg-accent-gradient px-5 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="font-display text-xs tracking-widest text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
    </div>
  );
}
