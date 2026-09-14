# FE-20 — Reorganizar `page/` vs `components/` e concluir a migração para `features/`

**Repo:** pandora-front · **Tipo:** refactor · **Base:** `main`
**Branch sugerida:** `refactor/dir-layout`
**Status:** implementado em `refactor/dir-layout` — depende de merge.
Decisão: ADR-0011.

## Problema

A migração para `features/` parou no meio: componentes de domínio ainda
moram em `components/` flat (`parent_tree`, `stats_panel`, `plotly`,
`apply_gate_dialog`, `delete_gate_dialog`, `file_select_list`,
`color_picker`), uma página de rota vive em `components/page/experiment/[id]`,
e `components/headers` é o Header da app com nome que colide com headers de
FCS. `page/organizations` (419 linhas) ainda carrega três tabs inline.

## Escopo

### 1. Rotas em `page/`

- `components/page/experiment/[id]/index.tsx` → `page/experiment/[id]/`;
  `components/page/experiments/{Card,Container,NewExperiment}` →
  `page/experiments/` ou `features/experiment/components/` conforme o
  domínio. `components/page/` deixa de existir.

### 2. Domínio em `features/`

- `stats_panel` e `plotly` viram shells dentro de `features/stats/` e
  `features/plot/` (seus subcomponentes e hooks já moram lá).
- `apply_gate_dialog`, `delete_gate_dialog`, `file_select_list`,
  `color_picker` → `features/gate/components/` (consumidores são de gate).
- `parent_tree` → `features/experiment/` (junto com FE-18).

### 3. UI neutra em `components/`

- Restam: `Layout`, `ProtectedRoute`, `footer`, `InviteModal`,
  `OrganizationMembers` e `headers` → renomear para `header` (componente
  `Header` global; evita colisão conceitual com headers FCS).

### 4. `page/organizations`

Extrair as três tabs inline (`OrgsTab`, `CreateOrgTab`, `InvitesTab`) para
componentes na mesma pasta — a página fica como composição de tabs.

## Arquivos a tocar

- Moves listados acima + todos os imports correspondentes
  (`router/index.tsx`, `App.tsx`, consumidores dos componentes movidos).
- `src/page/organizations/index.tsx` — split das tabs.

## Critérios de aceite

- [ ] `src/page/` contém todas as rotas; `components/page/` não existe.
- [ ] `grep -rn "components/parent_tree\|components/plotly\|stats_panel" src`
      vazio — imports resolvidos.
- [ ] `components/` só tem UI neutra; nenhum arquivo de domínio resta lá.
- [ ] Typecheck/testes/build verdes; app sobe sem warnings de import.

## Fora de escopo

- Decomposição interna dos arquivos movidos (FE-18/FE-19 tratam).
- Mudanças visuais/de comportamento — refactor puro.
