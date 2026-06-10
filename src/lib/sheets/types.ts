export type BlockType =
  | "heading"
  | "field"
  | "attribute"
  | "bar"
  | "notes"
  | "divider"
  | "image"
  | "dice";

export type Block = {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, unknown>;
  bind?: string;
};

export type SheetTheme = {
  preset?: "grimorio" | "pergaminho" | "sombrio" | "arcano" | "neon" | "minimal";
  bg?: string;
  font?: string;
  accent?: string;
};

export type SheetLayout = {
  version: 1;
  grid: { cols: number; rowHeight: number };
  blocks: Block[];
  background?: { color?: string; image?: string; preset?: string };
};

export type SheetValues = Record<string, unknown>;

export const DEFAULT_LAYOUT: SheetLayout = {
  version: 1,
  grid: { cols: 12, rowHeight: 40 },
  blocks: [],
};

export const PRESETS: { id: NonNullable<SheetTheme["preset"]>; label: string; bg: string; accent: string }[] = [
  { id: "grimorio", label: "Grimório", bg: "linear-gradient(135deg,#2a1647,#0d0420)", accent: "#a855f7" },
  { id: "pergaminho", label: "Pergaminho", bg: "linear-gradient(135deg,#f5e6c8,#d8c08a)", accent: "#7c2d12" },
  { id: "sombrio", label: "Sombrio", bg: "linear-gradient(135deg,#0a0a0a,#1a1a1a)", accent: "#dc2626" },
  { id: "arcano", label: "Arcano", bg: "linear-gradient(135deg,#0b1740,#06243d)", accent: "#22d3ee" },
  { id: "neon", label: "Neon", bg: "linear-gradient(135deg,#0a0014,#1a0033)", accent: "#22ff88" },
  { id: "minimal", label: "Minimal", bg: "#0f0f12", accent: "#e5e5e5" },
];

export function newBlock(type: BlockType, partial: Partial<Block> = {}): Block {
  const base: Block = {
    id: crypto.randomUUID().slice(0, 8),
    type,
    x: 0,
    y: 0,
    w: 6,
    h: 3,
    props: {},
    ...partial,
  };
  switch (type) {
    case "heading":
      return { ...base, w: 12, h: 2, props: { text: "Título", level: 1, ...base.props } };
    case "field":
      return { ...base, w: 4, h: 2, props: { label: "Campo", type: "text", ...base.props } };
    case "attribute":
      return { ...base, w: 2, h: 3, props: { label: "ATR", ...base.props } };
    case "bar":
      return { ...base, w: 6, h: 2, props: { label: "HP", color: "#dc2626", max: 20, ...base.props } };
    case "notes":
      return { ...base, w: 12, h: 5, props: { label: "Notas", ...base.props } };
    case "divider":
      return { ...base, w: 12, h: 1, props: { ...base.props } };
    case "image":
      return { ...base, w: 4, h: 4, props: { url: "", alt: "Imagem", ...base.props } };
    case "dice":
      return { ...base, w: 3, h: 2, props: { label: "Ataque", formula: "1d20+3", ...base.props } };
  }
}
