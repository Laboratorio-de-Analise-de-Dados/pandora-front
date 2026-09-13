# ADR-0011 — `features/` como casa de componentes de domínio

- **Status:** Aceito
- **Data:** 2026-02-12
- **Contexto do código:** `src/components/`, `src/page/`, `src/features/`,
  `src/router/index.tsx`, `src/types/`

## Contexto

A revisão estrutural do front mostrou a migração para `features/` pela
metade. Hoje convivem três convenções:

- `src/features/<domínio>/{components,hooks,utils,context}` — estrutura nova
  (`plot`, `stats`, `experiment`, `gate`).
- `src/components/<nome>` flat — estilo antigo com componentes de domínio
  (`parent_tree`, `stats_panel`, `plotly`, `apply_gate_dialog`,
  `delete_gate_dialog`, `file_select_list`, `color_picker`, `headers`,
  `OrganizationMembers`, `InviteModal`).
- Página de rota fora de `page/`: `components/page/experiment/[id]` é
  montada pelo router, enquanto as demais rotas vivem em `src/page/`.

Sintomas concretos dessa ambiguidade: o tipo `SelectedSource` — domínio do
experimento — é exportado de `components/parent_tree` e importado por
`features/experiment/context` e `features/stats`; `components/headers` é o
Header global da app mas o nome colide com "headers" de FCS; e novos
componentes de domínio não têm lugar óbvio.

## Decisão

Fixar o destino de cada categoria de código:

- **`features/<domínio>/`** — tudo que pertence a um domínio: componentes,
  hooks, utils e contexto daquele domínio. `parent_tree` →
  `features/experiment`, `stats_panel`/`plotly` → shells finos em
  `features/stats`/`features/plot` (os subcomponentes já moram lá),
  `apply_gate_dialog`/`delete_gate_dialog`/`file_select_list` →
  `features/gate`, `color_picker` → `features/gate` (único consumidor).
- **`components/`** — só UI compartilhada e neutra de domínio: `Layout`,
  `ProtectedRoute`, `footer`, `Header` (renomear `headers` → `header`),
  `InviteModal`, `OrganizationMembers`.
- **`page/`** — só componentes de rota; `components/page/experiment/[id]`
  migra para `page/experiment/[id]`. `components/page/` deixa de existir.
- **Tipos de domínio** moram em `types/` (compartilhado) ou no `features/`
  dono — nunca exportados de dentro de um componente (`SelectedSource` sai
  de `parent_tree` para `features/experiment` ou `types/`).

## Alternativas consideradas

### A) Flat `components/` para tudo (status quo informal)

Descartada: é o estado atual e já produziu mega-arquivos sem fronteira de
domínio (parent_tree com 1044 linhas misturando gates, amostras e
subsamples) e tipos de domínio dentro de componente.

### B) Monorepo/pacotes por domínio

Descartada como no ADR-0008: sem segundo consumidor; a regra de diretórios
entrega o isolamento conceitual.

## Consequências

- Todo arquivo novo de domínio tem lugar inequívoco — revisão vira checar o
  destino, não discutir gosto.
- Migração é incremental: shells antigos em `components/` podem coexistir
  até serem movidos; PRDs de reorganização referenciam este ADR.
- Imports longos (`../../../../../components/color_picker`) somem quando o
  consumidor e o componente dividem o mesmo `features/`.
