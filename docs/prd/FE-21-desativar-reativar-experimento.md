# FE-21 — Desativar e reativar experimentos na listagem

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/experiment-restore`
**Status:** implementado na branch `feat/experiment-restore` — depende de
merge. Backend: BE-14 (`POST /experiment/<id>/restore`).

## Problema

Desativar um experimento (o DELETE, que é arquivamento — ADR-0005 do
backend) o fazia sumir para sempre: a listagem nunca pedia
`include_inactive` e não havia como reativar. Para o momento de evolução
da aplicação, o usuário precisa arquivar experimentos de teste sem risco —
e desfazer.

## Escopo

### 1. Listagem com toggle

- `GET /experiment/?include_inactive=true` via
  `fetchExperiments(includeInactive)`; a página de experimentos ganha o
  switch **"Mostrar desativados"** ao lado do filtro de organização.
- O refresh pós-ação preserva o estado do toggle (`onChanged` desce do
  page → container → card).

### 2. Card desativado

- Mesmo destaque das amostras desabilitadas: cinza, borda tracejada,
  badge "Desativado", sem menu ⋮ (copiar/mover não se aplicam — o backend
  devolve 404 em inativos).
- Clique **não navega** — abre diálogo explicando que está arquivado e
  oferece **Reativar** (`restoreExperiment`).

### 3. Semântica honesta

- A ação que dizia "Excluir experimento" passa a dizer **"Desativar"** e
  o confirm avisa que dados/gates/subsamples são preservados e a ação é
  reversível — reflete o que o backend sempre fez.

## Arquivos a tocar

- `src/services/experimentService.ts` — `includeInactive` em
  `fetchExperiments`, novo `restoreExperiment`
- `src/providers/ExperimentContext/index.tsx` — `listExperiments`
  aceita a flag
- `src/page/experiments/index.tsx` — switch + prop `onChanged`
- `src/components/page/experiments/Container/index.tsx` — repassa
  `onChanged`
- `src/components/page/experiments/Card/` — card cinza + diálogo de
  restore
- `src/features/experiment/hooks/useExperimentPageActions.ts` — textos
  de "desativar"
- `src/components/page/experiment/[id]/index.tsx` — tooltip do ícone

## Critérios de aceite

- [x] Toggle ligado mostra inativos esmaecidos junto aos ativos; desligado
      esconde (default)
- [x] Clique no card inativo abre diálogo com botão Reativar; após
      reativar o card volta ao normal e continua visível
- [x] Card inativo não exibe menu de ações nem navega para a análise
- [x] Typecheck, `vitest` e `vite build` verdes

## Fora de escopo

- Reativar de dentro da página do experimento (inativo nem abre — 404).
- Purge físico — não existe delete de verdade na API (ADR-0005).
