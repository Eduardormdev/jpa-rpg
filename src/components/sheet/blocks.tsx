import { useState } from "react";
import { Dices } from "lucide-react";
import type { Block, SheetValues } from "@/lib/sheets/types";
import { toast } from "sonner";

type RenderProps = {
  block: Block;
  values: SheetValues;
  onChange: (bind: string, v: unknown) => void;
  editing: boolean;
};

function modifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function rollFormula(formula: string): { total: number; detail: string } {
  // 1d20+3, 2d6-1, etc.
  const re = /(\d*)d(\d+)|([+-]?\s*\d+)/g;
  let total = 0;
  const parts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(formula)) !== null) {
    if (m[2]) {
      const n = parseInt(m[1] || "1", 10);
      const sides = parseInt(m[2], 10);
      const rolls: number[] = [];
      for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * sides));
      const sub = rolls.reduce((a, b) => a + b, 0);
      total += sub;
      parts.push(`${n}d${sides}[${rolls.join(",")}]`);
    } else if (m[3]) {
      const v = parseInt(m[3].replace(/\s+/g, ""), 10);
      if (!isNaN(v)) { total += v; parts.push(m[3].replace(/\s+/g, "")); }
    }
  }
  return { total, detail: parts.join(" ") };
}

export function BlockRenderer({ block, values, onChange, editing }: RenderProps) {
  const v = block.bind ? values[block.bind] : undefined;

  switch (block.type) {
    case "heading": {
      const text = String(block.props.text ?? "Título");
      const level = (block.props.level as number) ?? 1;
      const cls = level === 1 ? "text-4xl" : level === 2 ? "text-3xl" : "text-2xl";
      return <div className={`font-display tracking-widest text-glow ${cls} px-2`}>{text}</div>;
    }
    case "field": {
      const label = String(block.props.label ?? "Campo");
      const type = String(block.props.type ?? "text");
      return (
        <div className="p-2">
          <label className="font-display text-[0.65rem] tracking-widest text-muted-foreground uppercase">{label}</label>
          <input
            type={type}
            value={(v as string | number | undefined) ?? ""}
            onChange={(e) => block.bind && onChange(block.bind, type === "number" ? Number(e.target.value) : e.target.value)}
            disabled={editing}
            className="mt-1 w-full rounded-md border border-border bg-background/60 px-2 py-1.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      );
    }
    case "attribute": {
      const label = String(block.props.label ?? "ATR");
      const score = Number(v ?? 10);
      const mod = modifier(score);
      return (
        <div className="h-full flex flex-col items-center justify-center p-2 rounded-md border border-accent/40 bg-card/40">
          <span className="font-display text-[0.65rem] tracking-widest text-accent uppercase">{label}</span>
          <input
            type="number"
            value={score}
            onChange={(e) => block.bind && onChange(block.bind, Number(e.target.value))}
            disabled={editing}
            className="mt-1 w-16 text-center bg-transparent text-2xl font-bold focus:outline-none"
          />
          <span className="mt-1 inline-grid place-items-center h-6 min-w-12 rounded-full bg-accent text-primary-foreground text-sm font-bold px-2">
            {mod >= 0 ? `+${mod}` : mod}
          </span>
        </div>
      );
    }
    case "bar": {
      const label = String(block.props.label ?? "Barra");
      const color = String(block.props.color ?? "#dc2626");
      const max = Number(block.props.max ?? 20);
      const current = Number((v as number | undefined) ?? max);
      const pct = Math.max(0, Math.min(100, (current / max) * 100));
      return (
        <div className="p-2 h-full flex flex-col">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display tracking-widest text-muted-foreground uppercase">{label}</span>
            <div className="flex items-center gap-1">
              <input type="number" value={current} onChange={(e) => block.bind && onChange(block.bind, Number(e.target.value))} disabled={editing} className="w-14 text-right bg-transparent focus:outline-none font-bold" />
              <span className="text-muted-foreground">/ {max}</span>
            </div>
          </div>
          <div className="mt-1 h-3 rounded-full bg-background/60 border border-border overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      );
    }
    case "notes": {
      const label = String(block.props.label ?? "Notas");
      return (
        <div className="h-full flex flex-col p-2">
          <label className="font-display text-[0.65rem] tracking-widest text-muted-foreground uppercase">{label}</label>
          <textarea
            value={(v as string | undefined) ?? ""}
            onChange={(e) => block.bind && onChange(block.bind, e.target.value)}
            disabled={editing}
            className="mt-1 flex-1 w-full rounded-md border border-border bg-background/60 px-2 py-1.5 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>
      );
    }
    case "divider":
      return <div className="h-full flex items-center px-2"><div className="h-px w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" /></div>;
    case "image": {
      const url = String(block.props.url ?? "");
      const alt = String(block.props.alt ?? "");
      return (
        <div className="h-full w-full grid place-items-center bg-background/40 rounded-md overflow-hidden border border-border">
          {url ? <img src={url} alt={alt} className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">Sem imagem</span>}
        </div>
      );
    }
    case "dice":
      return <DiceBlock block={block} editing={editing} />;
  }
}

function DiceBlock({ block, editing }: { block: Block; editing: boolean }) {
  const label = String(block.props.label ?? "Rolar");
  const formula = String(block.props.formula ?? "1d20");
  const [last, setLast] = useState<{ total: number; detail: string } | null>(null);
  return (
    <button
      type="button"
      disabled={editing}
      onClick={(e) => {
        e.stopPropagation();
        const r = rollFormula(formula);
        setLast(r);
        toast.success(`${label}: ${r.total}`, { description: r.detail });
      }}
      className="h-full w-full p-2 rounded-md border border-accent/40 bg-card/40 hover:bg-accent/10 transition flex flex-col items-center justify-center"
    >
      <Dices className="h-5 w-5 text-accent" />
      <span className="mt-1 font-display tracking-widest text-xs text-accent uppercase">{label}</span>
      <span className="text-xs text-muted-foreground">{formula}</span>
      {last && <span className="text-xl font-bold mt-1">{last.total}</span>}
    </button>
  );
}
