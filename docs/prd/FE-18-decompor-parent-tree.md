# FE-18 — Decompor o ParentTree em componentes por nó

**Repo:** pandora-front · **Tipo:** refactor · **Base:** `main`
**Branch sugerida:** `refactor/parent-tree`
**Status:** não iniciado. Decisões: ADR-0011, ADR-0012.

## Problema

`src/components/parent_tree/index.tsx` tem 1044 linhas. `renderGate`,
`renderFile` e `renderSubsampleGroup` são componentes disfarçados de função
— recebem um `handlers: TreeHandlers` com ~14 callbacks — e o `ParentTree`
acumula ~15 `useState` para menus ⋮, context menu, seleção em lote e alvos
de diálogo. Ler o render exige atravessar ~600 linhas de gestão de estado;
mudar qualquer interação recompila a árvore inteira.

## Escopo

### 1. Componentes por tipo de nó

Dentro de `features/experiment/components/parent-tree/` (destino por
ADR-0011 — `components/parent_tree/` migra junto):

- `GateTreeItem` — ex-`renderGate`: label com cor/autor/cópia/métricas e
  recursão dos filhos.
- `FileTreeItem` — ex-`renderFile`: amostra com checkbox no modo seleção,
  menu de ações e indicador de inativa.
- `SubsampleGroupItem` — ex-`renderSubsampleGroup`: header do grupo com
  checkbox, nome e menu ⋮.
- `ParentTree` fica como composição: mapeia grupos → itens e concentra os
  menus/diálogos globais.

### 2. Hook de interações

`useTreeInteractions` (mesma pasta) absorve o estado que hoje vive no
componente: âncoras dos três menus, alvos (gate/file/subsample), modo de
seleção + `selectedFileIds`, alvos de diálogo (disable/move/metadata/
rename/archive). Devolve o pacote pronto que os componentes consomem —
handlers incluídos.

### 3. Tipo de domínio fora do componente

`SelectedSource` sai de `parent_tree` para `features/experiment/` (ou
`types/` se o uso cross-feature justificar — hoje consomem
`features/experiment/context`, `SourceDropdown`, `SourceSelector` e
`stats_panel`).

## Arquivos a tocar

- `src/components/parent_tree/{index,dialogs,TreeNode}.tsx` →
  `src/features/experiment/components/parent-tree/*`
- `src/features/experiment/hooks/useTreeInteractions.ts` (novo)
- Consumidores do `SelectedSource`: `ExperimentWorkspaceContext`,
  `SourceDropdown`, `SourceSelector`, `stats_panel`,
  `components/page/experiment/[id]`

## Critérios de aceite

- [ ] Nenhuma função `render*` retornando JSX no `ParentTree` — só
      componentes.
- [ ] `ParentTree` sem `useState` de menus/diálogos/seleção — tudo via hook.
- [ ] `SelectedSource` importável sem atravessar `components/`.
- [ ] Comportamento idêntico: seleção em lote, menus, diálogos e árvore de
      gates funcionam como antes; testes existentes passam.

## Fora de escopo

- Mudança visual ou de comportamento — é refactor puro.
- Decomposição do `useExperimentPageActions` (FE-19) — os callbacks que o
  ParentTree consome continuam vindo da página.
