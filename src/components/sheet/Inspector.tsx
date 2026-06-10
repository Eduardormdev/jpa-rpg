import type { Block } from "@/lib/sheets/types";

export function Inspector({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void }) {
  function setProp(key: string, val: unknown) {
    onChange({ props: { ...block.props, [key]: val } });
  }
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-widest text-accent font-display">Bloco: {block.type}</div>
      <Row label="Bind (chave)">
        <input value={block.bind ?? ""} onChange={(e) => onChange({ bind: e.target.value })} placeholder="ex: forca, hp, nome" className="inp" />
      </Row>
      <Row label="Largura (1-12)">
        <input type="number" min={1} max={12} value={block.w} onChange={(e) => onChange({ w: Math.max(1, Math.min(12, Number(e.target.value))) })} className="inp" />
      </Row>
      <Row label="Altura (linhas)">
        <input type="number" min={1} value={block.h} onChange={(e) => onChange({ h: Math.max(1, Number(e.target.value)) })} className="inp" />
      </Row>

      {block.type === "heading" && (
        <>
          <Row label="Texto"><input value={String(block.props.text ?? "")} onChange={(e) => setProp("text", e.target.value)} className="inp" /></Row>
          <Row label="Nível">
            <select value={Number(block.props.level ?? 1)} onChange={(e) => setProp("level", Number(e.target.value))} className="inp">
              <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
            </select>
          </Row>
        </>
      )}

      {block.type === "field" && (
        <>
          <Row label="Rótulo"><input value={String(block.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} className="inp" /></Row>
          <Row label="Tipo">
            <select value={String(block.props.type ?? "text")} onChange={(e) => setProp("type", e.target.value)} className="inp">
              <option value="text">Texto</option><option value="number">Número</option>
            </select>
          </Row>
        </>
      )}

      {block.type === "attribute" && (
        <Row label="Rótulo"><input value={String(block.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} className="inp" /></Row>
      )}

      {block.type === "bar" && (
        <>
          <Row label="Rótulo"><input value={String(block.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} className="inp" /></Row>
          <Row label="Máximo"><input type="number" value={Number(block.props.max ?? 20)} onChange={(e) => setProp("max", Number(e.target.value))} className="inp" /></Row>
          <Row label="Cor"><input type="color" value={String(block.props.color ?? "#dc2626")} onChange={(e) => setProp("color", e.target.value)} className="h-9 w-full rounded-md border border-border bg-background" /></Row>
        </>
      )}

      {block.type === "notes" && (
        <Row label="Rótulo"><input value={String(block.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} className="inp" /></Row>
      )}

      {block.type === "image" && (
        <>
          <Row label="URL da imagem"><input value={String(block.props.url ?? "")} onChange={(e) => setProp("url", e.target.value)} placeholder="https://..." className="inp" /></Row>
          <Row label="Alt"><input value={String(block.props.alt ?? "")} onChange={(e) => setProp("alt", e.target.value)} className="inp" /></Row>
        </>
      )}

      {block.type === "dice" && (
        <>
          <Row label="Rótulo"><input value={String(block.props.label ?? "")} onChange={(e) => setProp("label", e.target.value)} className="inp" /></Row>
          <Row label="Fórmula"><input value={String(block.props.formula ?? "1d20")} onChange={(e) => setProp("formula", e.target.value)} placeholder="1d20+3" className="inp" /></Row>
        </>
      )}

      <style>{`.inp{margin-top:.25rem;width:100%;border-radius:.375rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:.4rem .6rem;font-size:.85rem}.inp:focus{outline:none;border-color:hsl(var(--accent))}`}</style>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-display text-[0.65rem] tracking-widest text-muted-foreground uppercase">{label}</label>
      {children}
    </div>
  );
}
