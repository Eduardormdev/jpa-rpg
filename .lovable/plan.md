# Fichas Modulares — Plano

## Objetivo
Adicionar item **"Fichas"** no header (entre Novidades e Histórias) e criar uma área onde usuários autenticados montem fichas de personagem modulares a partir de templates, com um editor visual estilo Canva (arrastar blocos, redimensionar, configurar).

## Navegação e rotas

- `SiteHeader.tsx`: adicionar link **Fichas** → `/fichas` (entre Novidades e Histórias).
- Rotas TanStack (todas dentro de `_authenticated` exceto a galeria pública de templates oficiais):
  - `fichas.index.tsx` → lista de fichas do usuário + botão "Nova ficha" + galeria de templates.
  - `fichas.templates.tsx` → galeria de templates (D&D 5e, Tormenta, Call of Cthulhu, Genérico, Em branco, etc.).
  - `_authenticated.fichas.$sheetId.tsx` → **editor** (canvas modular).
  - `_authenticated.fichas.$sheetId.view.tsx` → modo leitura/jogo (read-only, otimizado para mesa).
  - `fichas.publica.$slug.tsx` → ficha pública compartilhável (read-only, se o dono marcar como pública).

## Modelo de dados (Lovable Cloud)

Tabelas novas em `public`:

- **`sheet_templates`** — modelos oficiais e da comunidade.
  - `name`, `system` (dnd5e, tormenta20, coc, generico, custom), `description`, `cover_url`, `schema jsonb` (definição de blocos + layout padrão), `is_official bool`, `created_by uuid`, `is_public bool`.
- **`character_sheets`** — fichas dos usuários.
  - `owner_id uuid` (auth.users), `template_id uuid null`, `title`, `system`, `cover_url`, `layout jsonb` (array de blocos posicionados), `values jsonb` (valores dos campos), `theme jsonb` (cores/fonte/fundo), `is_public bool`, `public_slug text unique null`, `updated_at`.
- **`sheet_versions`** (opcional fase 2) — snapshots para histórico.

RLS:
- `character_sheets`: owner faz tudo; SELECT público quando `is_public = true`; admin tudo.
- `sheet_templates`: SELECT para todos quando `is_official OR is_public`; INSERT/UPDATE/DELETE só dono ou admin.
- GRANTs padrão (`authenticated` full, `service_role` all, `anon` SELECT apenas onde há policy pública).

## Editor modular (estilo Canva)

Tecnologias:
- **`@dnd-kit`** (já instalado) para arrastar blocos da paleta para o canvas e reordenar.
- **Grid livre 12 colunas** com snapping; cada bloco tem `{id, type, x, y, w, h, props, bind}`.
- Resize por handles (componente leve próprio, sem nova dependência pesada).
- Auto-save (debounce 800ms) via server function.

Tipos de bloco iniciais:
- **Texto/título** (rich text simples).
- **Campo** (label + input: texto, número, textarea).
- **Atributo** (ex.: FOR 14 / +2) com cálculo de modificador.
- **Barra** (HP/Mana/Stress — valor atual/máximo, cor).
- **Lista** (inventário, magias, habilidades — itens dinâmicos).
- **Dados** (botão de rolagem `1d20+mod`, mostra resultado).
- **Imagem** (avatar do personagem, upload para bucket `sheet-assets`).
- **Divisor / Seção** (agrupador colapsável).
- **Tabela** (perícias, ataques).
- **Checkbox grupo** (proficiências, traços).
- **Notas** (área livre markdown).

Painéis do editor:
- **Esquerda**: paleta de blocos + camadas (lista de blocos com drag-to-reorder).
- **Centro**: canvas com zoom, grade, fundo configurável (cor, textura, imagem).
- **Direita**: inspector do bloco selecionado (props, binding com campo, estilos, cor, fonte).
- **Topo**: título, sistema, salvar/desfazer/refazer, alternar **Editar ↔ Jogar**, exportar PDF/PNG, compartilhar.

Temas/presets visuais: grimório, pergaminho, sombrio, arcano, neon, minimal (mesmos presets do livro, reutilizados via tokens em `styles.css`).

## Templates iniciais (seed)
- **Em branco** (canvas vazio).
- **Genérico RPG** (nome, classe, nível, atributos, HP, inventário, notas).
- **D&D 5e simplificado** (6 atributos + perícias + ataques + magias).
- **Tormenta 20 básico**.
- **One-page mini** (ficha rápida para one-shots).

Seed via migration (INSERT em `sheet_templates` com `is_official=true`).

## Server functions (`src/lib/sheets.functions.ts`)
- `listMySheets`, `getSheet(id)`, `createSheet({templateId?, title})`, `updateSheet(id, patch)` (layout/values/theme/title), `duplicateSheet(id)`, `deleteSheet(id)`, `togglePublic(id, bool)` → gera `public_slug`.
- `listTemplates({system?})`, `getTemplate(id)`, `saveAsTemplate(sheetId, {name, isPublic})`.
- Todas com `requireSupabaseAuth` exceto `getPublicSheet(slug)` e `listTemplates` (público para oficiais).

## Storage
- Bucket novo **`sheet-assets`** (público para leitura) — avatares, imagens de fundo, ícones customizados de bloco.

## Export
- **PNG**: `html-to-image` (dependência leve a adicionar) sobre o canvas.
- **PDF**: `jspdf` + a imagem PNG (uma página A4).
- Botão "Imprimir" usa `window.print()` com CSS print-friendly como fallback.

## Modo "Jogar"
- Esconde paleta/inspector, mostra apenas o canvas com inputs editáveis e botões de rolagem.
- Toolbar flutuante: rolar dados, alternar tema, tela cheia.

## Fases

1. **Fase A — Esqueleto**: link no header, rota `/fichas` (lista vazia), migration de tabelas + RLS + GRANTs, server functions CRUD básicas, criação a partir de template "em branco".
2. **Fase B — Editor v1**: canvas com grid, paleta com 5 blocos essenciais (texto, campo, atributo, barra, notas), drag/drop, resize, inspector, auto-save, modo Jogar.
3. **Fase C — Templates oficiais**: seed dos 4 templates + galeria visual em `/fichas/templates`.
4. **Fase D — Blocos avançados**: dados/rolagem, lista, tabela, imagem (upload), checkboxes, divisor.
5. **Fase E — Compartilhar/Exportar**: ficha pública por slug, export PNG/PDF, duplicar, salvar como template, presets visuais.

## Detalhes técnicos relevantes

- **Schema `layout jsonb`**:
  ```ts
  type Block = { id: string; type: BlockType; x: number; y: number; w: number; h: number; props: Record<string, unknown>; bind?: string }
  type Layout = { version: 1; grid: { cols: 12; rowHeight: number }; blocks: Block[]; background?: { color?: string; image?: string; preset?: string } }
  ```
- **`values jsonb`** indexado por `bind` (ex.: `{ "atr.for": 14, "hp.current": 22 }`) para separar definição visual de dados, permitindo trocar template sem perder valores compatíveis.
- Editor isolado em `src/components/sheet/` (`SheetEditor`, `BlockPalette`, `Canvas`, `Inspector`, `blocks/*`).
- `ssr: false` na rota do editor (TanStack) — é client-only pesado, igual ao livro.
- Reutilizar presets visuais já criados em `nossas-historias.$book.tsx` movendo-os para `src/lib/visual-presets.ts`.

## Fora de escopo (por enquanto)
- Colaboração em tempo real (multi-cursor).
- Marketplace pago de templates.
- Importação de fichas externas (Roll20/D&D Beyond).
- Macros/scripting complexo de regras por sistema.

Confirma para eu começar pela **Fase A**? Posso já enfileirar a migration junto.
