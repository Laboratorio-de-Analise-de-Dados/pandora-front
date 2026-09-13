# FE-19 — Dividir `useExperimentPageActions` em hooks por domínio

**Repo:** pandora-front · **Tipo:** refactor · **Base:** `main`
**Branch sugerida:** `refactor/experiment-actions`
**Status:** implementado em `refactor/experiment-actions` — depende de
merge. Decisão: ADR-0012.

## Problema

`src/features/experiment/hooks/useExperimentPageActions.ts` tem 588 linhas
orquestrando quatro domínios: metadados do experimento (update/delete/
download/add-file), amostras (disable/enable/move), gates (rename/delete/
apply + conflitos) e subsamples (create/rename/archive). A página
desestrutura ~25 campos de um único retorno — acoplamento total: mexer em
gates recompila a assinatura de subsamples.

## Escopo

### 1. Hooks por domínio (mesma pasta)

- `useExperimentMetaActions` — update, delete, download, `handleAddFile`
  (+`addingFile`), `savingExperiment`, `canEditExperiment`.
- `useFileActions` — disable/enable/move com o padrão de lote
  (`allSettled` + toasts agregados + re-seleção da fonte).
- `useGateActions` — rename, delete (alvo + confirm + erro), apply
  (dry-run, conflitos, `pendingApply`).
- `useSubsampleActions` — create/rename/archive devolvendo erro para o
  campo do diálogo.

Todos recebem `useExperimentWorkspace()` internamente; a página compõe os
quatro.

### 2. Extração de erro

`extractErrorMessage` local sai — usa `utils/apiError` do FE-17.

## Arquivos a tocar

- `src/features/experiment/hooks/` — 4 hooks novos; o arquivo atual vira um
  barril fino (`useExperimentPageActions` = composição dos 4) ou é removido
  se a página consumir os hooks diretamente — decidir na implementação pelo
  que ficar mais legível no `[id]/index.tsx`.
- `src/components/page/experiment/[id]/index.tsx` — desestrutura os hooks
  novos (bloco único de ~25 campos some).

## Critérios de aceite

- [ ] Cada hook novo toca exatamente um domínio; nenhum excede ~200 linhas.
- [ ] Assinatura pública da página inalterada em comportamento — mesmos
      toasts, mesma navegação, mesma re-seleção de fonte.
- [ ] Typecheck/testes/build verdes.

## Fora de escopo

- Mudar o que cada ação faz (mensagens, permissões) — refactor puro.
- ParentTree (FE-18) — independente; a ordem dos dois tanto faz.
