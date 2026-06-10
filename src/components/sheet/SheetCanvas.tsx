import { useRef, useState, useEffect } from "react";
import type { Block, SheetLayout, SheetValues } from "@/lib/sheets/types";
import { BlockRenderer } from "./blocks";
import { Trash2, Move, GripHorizontal } from "lucide-react";

type Props = {
  layout: SheetLayout;
  values: SheetValues;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (blocks: Block[]) => void;
  onValueChange: (bind: string, v: unknown) => void;
  playMode: boolean;
};

const CELL_W = 64; // px per col approx (visual only; we use percentages)

export function SheetCanvas({ layout, values, selectedId, onSelect, onUpdate, onValueChange, playMode }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; mode: "move" | "resize"; startX: number; startY: number; orig: Block } | null>(null);
  const cols = layout.grid.cols;
  const rowH = layout.grid.rowHeight;

  function cellSize() {
    const w = ref.current?.clientWidth ?? cols * CELL_W;
    return { cw: w / cols, rh: rowH };
  }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: MouseEvent) {
      if (!drag) return;
      const { cw, rh } = cellSize();
      const dx = Math.round((e.clientX - drag.startX) / cw);
      const dy = Math.round((e.clientY - drag.startY) / rh);
      const next = layout.blocks.map((b) => {
        if (b.id !== drag.id) return b;
        if (drag.mode === "move") {
          const nx = Math.max(0, Math.min(cols - drag.orig.w, drag.orig.x + dx));
          const ny = Math.max(0, drag.orig.y + dy);
          return { ...b, x: nx, y: ny };
        } else {
          const nw = Math.max(1, Math.min(cols - drag.orig.x, drag.orig.w + dx));
          const nh = Math.max(1, drag.orig.h + dy);
          return { ...b, w: nw, h: nh };
        }
      });
      onUpdate(next);
    }
    function onUp() { setDrag(null); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, layout.blocks, cols, onUpdate]);

  function removeBlock(id: string) {
    onUpdate(layout.blocks.filter((b) => b.id !== id));
    onSelect(null);
  }

  const maxY = Math.max(20, ...layout.blocks.map((b) => b.y + b.h)) + 2;

  return (
    <div
      ref={ref}
      className={`relative w-full rounded-xl border border-border overflow-hidden ${playMode ? "" : "shadow-card"}`}
      style={{
        minHeight: maxY * rowH,
        backgroundImage: !playMode
          ? "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)"
          : undefined,
        backgroundSize: !playMode ? `${100 / cols}% ${rowH}px` : undefined,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onSelect(null); }}
    >
      {layout.blocks.map((b) => {
        const isSel = selectedId === b.id;
        return (
          <div
            key={b.id}
            onClick={(e) => { e.stopPropagation(); if (!playMode) onSelect(b.id); }}
            className={`absolute group transition-shadow ${isSel && !playMode ? "ring-2 ring-accent shadow-glow" : ""}`}
            style={{
              left: `${(b.x / cols) * 100}%`,
              top: b.y * rowH,
              width: `${(b.w / cols) * 100}%`,
              height: b.h * rowH,
            }}
          >
            <div className="absolute inset-1">
              <BlockRenderer block={b} values={values} onChange={onValueChange} editing={!playMode} />
            </div>

            {!playMode && (
              <>
                {/* drag handle */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    onSelect(b.id);
                    setDrag({ id: b.id, mode: "move", startX: e.clientX, startY: e.clientY, orig: b });
                  }}
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 grid place-items-center h-5 w-10 rounded-full bg-card border border-border text-muted-foreground hover:bg-accent hover:text-primary-foreground cursor-grab opacity-0 group-hover:opacity-100 ${isSel ? "opacity-100" : ""}`}
                  title="Mover"
                >
                  <GripHorizontal className="h-3 w-3" />
                </button>
                {/* delete */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeBlock(b.id); }}
                  className={`absolute -top-2 -right-2 grid place-items-center h-7 w-7 rounded-full bg-white text-red-600 border-2 border-red-600 shadow-lg opacity-0 group-hover:opacity-100 ${isSel ? "opacity-100" : ""}`}
                  title="Excluir bloco"
                  aria-label="Excluir bloco"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                {/* resize */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    onSelect(b.id);
                    setDrag({ id: b.id, mode: "resize", startX: e.clientX, startY: e.clientY, orig: b });
                  }}
                  className={`absolute -bottom-1 -right-1 grid place-items-center h-4 w-4 rounded-sm bg-accent text-primary-foreground cursor-se-resize opacity-0 group-hover:opacity-100 ${isSel ? "opacity-100" : ""}`}
                  title="Redimensionar"
                >
                  <Move className="h-2.5 w-2.5" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
