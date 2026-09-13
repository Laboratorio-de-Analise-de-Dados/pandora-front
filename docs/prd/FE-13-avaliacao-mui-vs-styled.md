# FE-13 — Avaliação: manter MUI ou migrar para styled-components puro

**Repo:** pandora-front · **Tipo:** avaliação · **Base:** `main`
**Status:** avaliação concluída — recomendação: **manter MUI** e atacar o peso real.

## Problema

O bundle de produção é um único chunk de **5.96 MB (1.81 MB gzip)** e levantou-se
a hipótese de que o MUI seria o peso principal — trocando-o por
styled-components puro, o projeto ficaria "mais leve". Este PRD avalia a
hipótese com dados do repo.

## Dados medidos (13/09/2026)

### Ocupação de disco por pacote (proxy de peso no bundle)

| Pacote              | Tamanho    | Uso real em `src/`                            |
| ------------------- | ---------- | --------------------------------------------- |
| `plotly.js`         | **~98 MB** | plot principal (toda a visualização)          |
| `@mui/material`     | ~12 MB     | **48 arquivos** importam                      |
| `@mui/x-data-grid`  | ~9,3 MB    | **zero imports — dep morta**                  |
| `@mui/x-charts`     | ~3,4 MB    | **zero imports — dep morta**                  |
| `@mui/x-tree-view`  | ~2,4 MB    | 1 arquivo (`parent_tree`)                     |
| `styled-components` | ~2,3 MB    | 5 arquivos direto (+ engine do MUI via alias) |
| `@emotion/react`    | ~1,3 MB    | transitivo do MUI (cache/css prop)            |

### O que o código usa do MUI

Predominantemente **primitivos básicos**: `Box` (12), `Typography` (9),
`Button` (6), `TextField` (4), `Paper` (4), `Tooltip` (3), `Menu`/`MenuItem`,
`Popover`, `Drawer`, `FormControl`, `ToggleButton`. Mais `x-tree-view` na árvore
de gates e o tema dark/light via `ThemeContext` + `CssBaseline`.

O styled-engine do MUI já é **aliased para styled-components**
(`@mui/styled-engine-sc` em `vite.config.ts` + `tsconfig.path.json`) — ou seja,
não existe "segunda engine de CSS" no bundle.

## Opções avaliadas

### A) Remover o MUI, usar só styled-components

- **Ganho estimado:** ~150–250 KB gzip (MUI + emotion), ~10% do bundle.
- **Custo:** reescrever os ~48 arquivos e reconstruir manualmente Dialog,
  Popover, Menu, Tooltip, Drawer, formulários, TreeView e o sistema de tema
  dark/light — com acessibilidade (focus trap, aria, teclado) por conta própria.
- **Veredito:** descartada. Esforço de semanas + regressão de a11y por ~10% do
  bundle. O MUI não é o problema de peso.

### B) Manter MUI e atacar o peso real (recomendada)

O elefante é o **plotly.js** (~1 MB+ gzip estimado dentro do chunk). Ações por
ordem de custo-benefício:

1. **Remover deps mortas**: `@mui/x-data-grid` e `@mui/x-charts` têm zero
   imports — ~12,7 MB de disco e dependências a menos para manter. Custo: zero.
   _(executado em 13/09/2026 na branch `refactor/node-26-upgrade`)_
2. **Code-split por rota**: `React.lazy` na página do experimento (a que usa
   plotly) — o resto do app (login, listagem, organizações) deixaria de baixar
   o plotly.
3. **Plotly parcial**: trocar `plotly.js` por `plotly.js-basic-dist` ou bundle
   custom (scatter/heatmap/histogram apenas) — pode cortar o plotly pela
   metade ou mais.
4. **`@mui/x-tree-view`**: usado em 1 arquivo (`parent_tree`). **Decisão
   (13/09/2026):** remover junto do FE-11 — a árvore vai ganhar o nível
   "subsample" (3 níveis heterogêneos) e será reescrita como componente
   próprio, eliminando o último `@mui/x-*`.

### C) Manter tudo como está

Descartada: existem vitórias de custo zero (deps mortas) e o chunk único é
evitável com lazy loading trivial.

## Recomendação

Opção B. MUI fica — é a base de componentes e tema do projeto e seu custo real
(~10% do bundle) não justifica uma mini design system própria. O peso se ataca
onde está: plotly, deps mortas e ausência de code-splitting.

## Critérios de decisão (registrar quando executado)

- [x] Deps mortas (`x-data-grid`, `x-charts`) removidas (13/09/2026)
- [ ] Bundle inicial sem plotly para rotas que não o usam
- [ ] Chunk principal abaixo de ~1 MB gzip
- [ ] Reavaliar remoção do MUI **somente se** o uso de componentes encolher
      para <10 arquivos ou aparecer requirement de bundle mínimo

## Fora de escopo

- Troca de framework/component library completa
- Migração para MUI 9 (coberta pela lista de majors pendentes do FE-12)
