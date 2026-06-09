import { useEffect, useMemo, useState } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  X, Plus, Trash2, Copy, GripVertical, History, FolderPlus, Loader2, Pencil, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Chapter = {
  id: string; book: string; parent_id: string | null;
  position: number; title: string; kind: string;
};
type Page = {
  id: string; book: string; position: number; type: string; url: string;
  title: string | null; category: string | null; chapter_id: string | null;
  status: string; is_locked: boolean; slug: string | null;
};

const KINDS: { value: string; label: string }[] = [
  { value: "volume", label: "Volume" },
  { value: "arco", label: "Arco" },
  { value: "capitulo", label: "Capítulo" },
  { value: "secao", label: "Seção" },
];

export function StructurePanel({
  book, onClose, onChanged,
}: { book: string; onClose: () => void; onChanged: () => Promise<void> }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function load() {
    setLoading(true);
    const [{ data: ch }, { data: pg }] = await Promise.all([
      supabase.from("story_chapters").select("*").eq("book", book).order("position"),
      supabase.from("story_pages").select("*").eq("book", book).order("position"),
    ]);
    setChapters((ch ?? []) as Chapter[]);
    setPages((pg ?? []) as Page[]);
    setLoading(false);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [book]);

  const orphanPages = useMemo(() => pages.filter((p) => !p.chapter_id), [pages]);
  const pagesByChapter = useMemo(() => {
    const m: Record<string, Page[]> = {};
    pages.forEach((p) => { if (p.chapter_id) (m[p.chapter_id] ??= []).push(p); });
    return m;
  }, [pages]);

  async function addChapter() {
    setBusy(true);
    const nextPos = chapters.length ? Math.max(...chapters.map((c) => c.position)) + 1 : 0;
    const { error } = await supabase.from("story_chapters").insert({
      book, position: nextPos, title: "Novo capítulo", kind: "capitulo",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await load();
  }

  async function renameChapter(c: Chapter, title: string) {
    await supabase.from("story_chapters").update({ title }).eq("id", c.id);
    await load();
  }
  async function setKind(c: Chapter, kind: string) {
    await supabase.from("story_chapters").update({ kind }).eq("id", c.id);
    await load();
  }
  async function deleteChapter(c: Chapter) {
    if (!confirm(`Excluir "${c.title}"? As páginas voltam para "sem capítulo".`)) return;
    await supabase.from("story_chapters").delete().eq("id", c.id);
    await load(); await onChanged();
  }

  async function persistChapterOrder(list: Chapter[]) {
    setChapters(list);
    await Promise.all(list.map((c, i) =>
      supabase.from("story_chapters").update({ position: i }).eq("id", c.id),
    ));
  }
  async function persistPageOrder(list: Page[]) {
    setPages((prev) => {
      const map = new Map(list.map((p) => [p.id, p]));
      return prev.map((p) => map.get(p.id) ?? p);
    });
    await Promise.all(list.map((p, i) =>
      supabase.from("story_pages").update({ position: p.position }).eq("id", p.id),
    ));
    await onChanged();
  }

  function onDragChapters(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = chapters.findIndex((c) => c.id === active.id);
    const newIdx = chapters.findIndex((c) => c.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    void persistChapterOrder(arrayMove(chapters, oldIdx, newIdx));
  }

  function onDragPages(chapterId: string | null) {
    return async (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const list = chapterId ? pagesByChapter[chapterId] ?? [] : orphanPages;
      const oldIdx = list.findIndex((p) => p.id === active.id);
      const newIdx = list.findIndex((p) => p.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      const reordered = arrayMove(list, oldIdx, newIdx);
      // Reassign positions across the whole book, keeping groups continuous
      const allOrdered: Page[] = [];
      orphanPages.forEach((p) => { if (chapterId === null) return; allOrdered.push(p); });
      if (chapterId === null) reordered.forEach((p) => allOrdered.push(p));
      chapters.forEach((c) => {
        if (c.id === chapterId) reordered.forEach((p) => allOrdered.push(p));
        else (pagesByChapter[c.id] ?? []).forEach((p) => allOrdered.push(p));
      });
      const stamped = allOrdered.map((p, i) => ({ ...p, position: i }));
      await persistPageOrder(stamped);
    };
  }

  async function moveToChapter(p: Page, chapter_id: string | null) {
    await supabase.from("story_pages").update({ chapter_id }).eq("id", p.id);
    await load(); await onChanged();
  }
  async function setStatus(p: Page, status: string) {
    await supabase.from("story_pages").update({ status }).eq("id", p.id);
    await load(); await onChanged();
  }
  async function toggleLock(p: Page) {
    await supabase.from("story_pages").update({ is_locked: !p.is_locked }).eq("id", p.id);
    await load(); await onChanged();
  }
  async function renamePage(p: Page, title: string) {
    await supabase.from("story_pages").update({ title }).eq("id", p.id);
    await load(); await onChanged();
  }
  async function deletePage(p: Page) {
    if (!confirm(`Excluir a página "${p.title ?? "(sem título)"}"?`)) return;
    await supabase.storage.from("story-pages").remove([p.url]);
    await supabase.from("story_pages").delete().eq("id", p.id);
    await load(); await onChanged();
  }
  async function duplicatePage(p: Page) {
    setBusy(true);
    try {
      // Copy underlying file
      const { data: blob, error: dlErr } = await supabase.storage.from("story-pages").download(p.url);
      if (dlErr || !blob) throw dlErr ?? new Error("Falha ao baixar arquivo.");
      const ext = p.url.split(".").pop() ?? "bin";
      const newPath = `${book}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("story-pages").upload(newPath, blob, { contentType: blob.type });
      if (upErr) throw upErr;
      const nextPos = pages.length ? Math.max(...pages.map((x) => x.position)) + 1 : 0;
      const { error: dbErr } = await supabase.from("story_pages").insert({
        book, position: nextPos, type: p.type, url: newPath,
        title: `${p.title ?? "Folha"} (cópia)`, category: p.category,
        chapter_id: p.chapter_id, status: "draft", is_locked: false,
      });
      if (dbErr) throw dbErr;
      toast.success("Página duplicada.");
      await load(); await onChanged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao duplicar.");
    } finally { setBusy(false); }
  }
  async function snapshotVersion(p: Page) {
    const label = prompt("Rótulo desta versão (opcional):") ?? null;
    const { error } = await supabase.from("story_page_versions").insert({
      page_id: p.id,
      snapshot: { title: p.title, url: p.url, type: p.type, category: p.category, chapter_id: p.chapter_id, status: p.status },
      label,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Versão salva.");
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex" onClick={onClose}>
      <div className="ml-auto h-full w-full max-w-2xl bg-card border-l border-border flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-display text-xl tracking-widest">Estrutura do livro</h3>
            <p className="text-xs text-muted-foreground mt-1">Capítulos, ordem das páginas, status e versões.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
          <button
            onClick={addChapter} disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            Novo capítulo
          </button>
          <span className="text-xs text-muted-foreground ml-auto">{pages.length} páginas · {chapters.length} capítulos</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="h-40 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* Orphan pages */}
              {orphanPages.length > 0 && (
                <ChapterBlock
                  title="Sem capítulo" kind="" hideHeaderActions
                  pages={orphanPages} chapters={chapters} sensors={sensors}
                  onDragEnd={onDragPages(null)}
                  onMove={moveToChapter} onStatus={setStatus} onLock={toggleLock}
                  onRename={renamePage} onDelete={deletePage}
                  onDuplicate={duplicatePage} onSnapshot={snapshotVersion}
                />
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragChapters}>
                <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {chapters.map((c) => (
                      <SortableChapter
                        key={c.id} chapter={c}
                        onRename={(t) => renameChapter(c, t)}
                        onKind={(k) => setKind(c, k)}
                        onDelete={() => deleteChapter(c)}
                      >
                        <ChapterBlock
                          title={c.title} kind={c.kind} hideHeader
                          pages={pagesByChapter[c.id] ?? []}
                          chapters={chapters} sensors={sensors}
                          onDragEnd={onDragPages(c.id)}
                          onMove={moveToChapter} onStatus={setStatus} onLock={toggleLock}
                          onRename={renamePage} onDelete={deletePage}
                          onDuplicate={duplicatePage} onSnapshot={snapshotVersion}
                        />
                      </SortableChapter>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {chapters.length === 0 && orphanPages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Nenhum capítulo ou página. Crie um capítulo ou adicione a primeira folha no leitor.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableChapter({
  chapter, onRename, onKind, onDelete, children,
}: {
  chapter: Chapter;
  onRename: (t: string) => void;
  onKind: (k: string) => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  useEffect(() => setTitle(chapter.title), [chapter.title]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="rounded-lg border border-border bg-background"
    >
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/20">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" title="Arraste para reordenar">
          <GripVertical className="h-4 w-4" />
        </button>
        <select value={chapter.kind} onChange={(e) => onKind(e.target.value)} className="text-[10px] uppercase tracking-widest rounded bg-accent/10 text-accent border border-accent/30 px-2 py-1">
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") { onRename(title); setEditing(false); } }} />
            <button onClick={() => { onRename(title); setEditing(false); }} className="text-emerald-600"><Check className="h-4 w-4" /></button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex-1 text-left text-sm font-medium hover:text-accent flex items-center gap-2">
            {chapter.title} <Pencil className="h-3 w-3 opacity-50" />
          </button>
        )}
        <button onClick={onDelete} className="text-red-600 hover:bg-red-50 rounded p-1" title="Excluir capítulo">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function ChapterBlock({
  title, kind, hideHeader, hideHeaderActions,
  pages, chapters, sensors, onDragEnd,
  onMove, onStatus, onLock, onRename, onDelete, onDuplicate, onSnapshot,
}: {
  title: string; kind: string; hideHeader?: boolean; hideHeaderActions?: boolean;
  pages: Page[]; chapters: Chapter[];
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (e: DragEndEvent) => void;
  onMove: (p: Page, chapter_id: string | null) => void;
  onStatus: (p: Page, status: string) => void;
  onLock: (p: Page) => void;
  onRename: (p: Page, title: string) => void;
  onDelete: (p: Page) => void;
  onDuplicate: (p: Page) => void;
  onSnapshot: (p: Page) => void;
}) {
  return (
    <div className={hideHeader ? "" : "rounded-lg border border-dashed border-border bg-muted/10 p-3"}>
      {!hideHeader && (
        <div className="flex items-center gap-2 mb-2">
          {kind && <span className="text-[10px] uppercase tracking-widest text-accent">{kind}</span>}
          <span className="text-sm font-medium">{title}</span>
          {!hideHeaderActions && <span className="ml-auto text-xs text-muted-foreground">{pages.length}</span>}
        </div>
      )}
      {pages.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-2 py-3">Nenhuma página aqui.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {pages.map((p) => (
                <SortablePage
                  key={p.id} page={p} chapters={chapters}
                  onMove={onMove} onStatus={onStatus} onLock={onLock}
                  onRename={onRename} onDelete={onDelete}
                  onDuplicate={onDuplicate} onSnapshot={onSnapshot}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortablePage({
  page, chapters, onMove, onStatus, onLock, onRename, onDelete, onDuplicate, onSnapshot,
}: {
  page: Page; chapters: Chapter[];
  onMove: (p: Page, chapter_id: string | null) => void;
  onStatus: (p: Page, status: string) => void;
  onLock: (p: Page) => void;
  onRename: (p: Page, title: string) => void;
  onDelete: (p: Page) => void;
  onDuplicate: (p: Page) => void;
  onSnapshot: (p: Page) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(page.title ?? "");
  useEffect(() => setTitle(page.title ?? ""), [page.title]);

  const statusColor = page.status === "published"
    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
    : page.status === "review"
      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
      : "bg-slate-500/15 text-slate-700 border-slate-500/30";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="group flex items-center gap-2 rounded-md bg-background border border-border px-2 py-1.5"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground w-8">{page.type}</span>
      {editing ? (
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
          onBlur={() => { onRename(page, title); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onRename(page, title); setEditing(false); } }}
          className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-sm" />
      ) : (
        <button onClick={() => setEditing(true)} className="flex-1 text-left text-sm truncate hover:text-accent">
          {page.title ?? <span className="italic text-muted-foreground">(sem título)</span>}
        </button>
      )}
      <select
        value={page.chapter_id ?? ""} onChange={(e) => onMove(page, e.target.value || null)}
        className="text-xs rounded border border-border bg-background px-1 py-0.5"
        title="Capítulo"
      >
        <option value="">— sem capítulo —</option>
        {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
      <select
        value={page.status} onChange={(e) => onStatus(page, e.target.value)}
        className={`text-[10px] uppercase tracking-widest rounded border px-1.5 py-0.5 ${statusColor}`}
        title="Status"
      >
        <option value="draft">rascunho</option>
        <option value="review">revisão</option>
        <option value="published">publicado</option>
      </select>
      <button onClick={() => onLock(page)} title={page.is_locked ? "Desbloquear" : "Bloquear"} className={`text-xs rounded px-1.5 py-0.5 border ${page.is_locked ? "bg-red-500/15 text-red-700 border-red-500/30" : "border-border text-muted-foreground"}`}>
        {page.is_locked ? "🔒" : "🔓"}
      </button>
      <button onClick={() => onSnapshot(page)} title="Salvar versão" className="text-muted-foreground hover:text-accent rounded p-1">
        <History className="h-4 w-4" />
      </button>
      <button onClick={() => onDuplicate(page)} title="Duplicar" className="text-muted-foreground hover:text-accent rounded p-1">
        <Copy className="h-4 w-4" />
      </button>
      <button onClick={() => onDelete(page)} title="Excluir" className="text-red-600 hover:bg-red-50 rounded p-1">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
