
# Plano — Editor avançado de livros "Nossas Histórias"

Objetivo: evoluir o visualizador atual em `src/routes/nossas-historias.$book.tsx` para um editor/leitor estilo grimório premium, sem quebrar o que já funciona (modos single/double/scroll, temas, sumário, prefs, upload por admin).

A entrega é dividida em **6 fases incrementais**. Cada fase é shippable sozinha — você aprova/itera antes de partirmos para a próxima.

---

## Fase 0 — Correções rápidas (entrega imediata)

- Trocar o ícone de "deletar página" de `bg-destructive/90` (fica camuflado no canto da página) para um botão com **fundo branco semi-opaco + ícone vermelho forte + borda + sombra**, sempre visível para admin (não esconder atrás de hover).
- Aumentar o `size` do ícone e o `z-index` para não ser coberto pelo conteúdo da página.
- Idem para o botão (+) flutuante: garantir contraste sobre temas claros/pergaminho.

Estimativa: 1 edição em `nossas-historias.$book.tsx`.

---

## Fase 1 — Estrutura do livro (capítulos + drag & drop)

Modelo de dados:

- Nova tabela `story_chapters` (book, position, title, parent_id nullable p/ subcapítulos, kind: "volume" | "arco" | "capitulo" | "secao").
- `story_pages` ganha: `chapter_id` (fk nullable), `status` ("draft" | "review" | "published"), `is_locked` (bool), `slug` opcional p/ links internos.
- Tabela `story_page_versions` (page_id, snapshot jsonb, created_by, created_at) para histórico/restaurar.

UI no painel admin do livro:
- Coluna lateral "Estrutura" com árvore: Volume → Capítulo → Seção → Página.
- Botões: criar/editar/excluir/duplicar página, criar capítulo, criar subcapítulo, agrupar em volume/arco.
- Drag-and-drop com `@dnd-kit/sortable` (já comum no stack) para reordenar páginas e capítulos.
- "Salvar como nova versão" — cria registro em `story_page_versions`.

Leitura:
- Navegação respeita capítulos (próximo capítulo / capítulo anterior).

---

## Fase 2 — Índice inteligente

- **Índice automático** gerado da árvore de capítulos + títulos das páginas.
- **Índice manual** sobrepõe a ordem automática quando admin edita.
- Hierarquia visual no sumário (indentação capítulo > seção > página).
- **Favoritar página** (persistido em `localStorage` por usuário não-logado; em tabela `user_bookmarks` para logado).
- Campo de **busca** (título + tags + categoria) com `useDeferredValue`.
- Sumário lateral recolhível (sheet à esquerda) com **progresso de leitura por capítulo** (% baseado em `book-pos`).
- Pulo direto: clicar na entrada do sumário chama `jumpTo(i)` (já existe).

---

## Fase 3 — Moldura, background e composição visual

Schema:
- `story_books` ganha `style_preset` ("grimorio" | "pergaminho" | "sombrio" | "arcano" | "neon" | "custom") + `style_overrides` jsonb.
- `story_pages` ganha `style_overrides` jsonb opcional (override por página).

Controles (modal "Estilo do livro" e por página):

**Moldura**
- Presets prontos (runas, pergaminho, metal, vidro, neon).
- Cantos decorativos via SVG bundled em `src/assets/frames/`.
- Espessura, cor, sombra, brilho ajustáveis.
- Liga/desliga moldura por tipo de página (capa, sumário, conteúdo, encerramento).

**Background**
- Sólido, gradiente, textura de papel (imagens em `src/assets/textures/`), upload de imagem custom, fundo animado (CSS keyframes: estrelas, fumaça).
- Por capítulo / por categoria.
- Opacidade + desfoque + overlay de padrão (mapa, runas, amuleto).

**Composição**
- Layouts: 1 coluna, 2 colunas, imagem topo/lateral/fundo.
- Blocos: citação, nota, alerta, dica, missão (componentes React reaproveitáveis).
- Largura ideal de leitura (`max-w-[65ch]` etc.) configurável.

---

## Fase 4 — Editor de conteúdo (blocos) + assets

- Trocar upload "PDF/imagem puro" por um **editor por blocos** (TipTap) com nodes customizados: texto, imagem, caixa mágica, citação, separador rúnico, bloco de missão, link interno entre páginas.
- Upload mantém-se para PDF/imagem como tipo de página alternativo.
- **Galeria de assets do projeto**: bucket `book-assets` reaproveitável entre livros (personagens, mapas, itens, cenas) com tags.
- Metadados por página: autor, data, tags, descrição curta/longa.
- **Preview em tempo real**: split view (editor à esquerda, página renderizada à direita, exatamente como o leitor verá).

---

## Fase 5 — Publicação, controle e "livro vivo"

Publicação:
- Status `draft` / `review` / `published` (já no schema da Fase 1).
- Agendamento (`publish_at` timestamp + cron via `/api/public/cron/publish-pages`).
- Aprovação: admin marca "review", outro admin aprova → vira `published`.
- Páginas com `is_locked` exibem placeholder p/ usuário comum.
- Histórico de edições + **comparar versões lado a lado** (diff de blocos).

Livro vivo:
- Links internos `[[slug-da-pagina]]` resolvidos no render.
- Escolhas interativas (bloco "escolha" que aponta p/ outras páginas — base p/ aventuras ramificadas).
- Páginas secretas (`unlock_condition` jsonb — ex: ter visitado X páginas).
- Trilha de leitura automática e sistema de progresso (já parcial na Fase 2).
- Comentários internos da equipe (tabela `story_page_comments`, visível só para admin).

---

## Detalhes técnicos

```text
src/routes/nossas-historias.$book.tsx        (refatorado, vira shell)
src/components/book/
  ├─ BookShell.tsx
  ├─ BookHeader.tsx
  ├─ reader/
  │   ├─ PageRenderer.tsx       (lê blocks ou PDF/imagem)
  │   ├─ Frame.tsx              (moldura SVG por preset)
  │   ├─ Background.tsx
  │   └─ blocks/                (Quote, Note, Mission, Choice, …)
  ├─ editor/
  │   ├─ BlockEditor.tsx        (TipTap)
  │   ├─ StructurePanel.tsx     (árvore drag-and-drop)
  │   ├─ StylePanel.tsx
  │   ├─ AssetGallery.tsx
  │   └─ VersionDiff.tsx
  └─ summary/
      ├─ SummarySheet.tsx       (lateral recolhível)
      └─ SearchBox.tsx
src/lib/book/
  ├─ book.functions.ts          (server fns: createChapter, reorderPages, …)
  ├─ versions.functions.ts
  └─ publish.functions.ts       (agendamento + cron)
src/routes/api/public/cron/publish-pages.ts
```

Dependências novas:
- `@dnd-kit/core`, `@dnd-kit/sortable` (drag-and-drop)
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image` (editor por blocos)
- nenhuma lib pesada de "page flip" — mantemos a animação CSS atual

Migrações de DB ocorrem **uma por fase** (1, 3, 5) com GRANTs corretos e RLS apenas-admin para escrita.

---

## Ordem proposta de entrega (cada item = 1 turno)

1. **Fase 0** — fix do ícone deletar + (+) admin
2. **Fase 1** — schema + estrutura/drag-drop
3. **Fase 2** — sumário lateral + busca + favoritos + progresso
4. **Fase 3** — molduras, backgrounds, presets visuais
5. **Fase 4** — editor por blocos + assets + preview em tempo real
6. **Fase 5** — publicação, versões, livro vivo

---

## Decisões que preciso confirmar antes da Fase 1

1. **Editor de blocos**: posso usar TipTap (React, MIT, bem mantido) ou prefere outro?
2. **Drag-and-drop**: `@dnd-kit` ok?
3. **Assets de moldura/textura**: gero via `imagegen` ou prefere subir manualmente?
4. **Páginas existentes (PDF/imagem)**: mantemos esse tipo "puro" como uma alternativa ao editor de blocos? (recomendo manter)
5. Posso começar pela **Fase 0 agora mesmo** enquanto você revisa o plano?
