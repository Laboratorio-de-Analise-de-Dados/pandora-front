# FE-28 — Derivar análise de outro experimento

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/derivar-analise`
**Status:** não iniciado (backend pronto em `feat/analysis-checkpoints` —
BE-19, ADR-0021).

## Problema

O backend já deriva a análise de um experimento para outro (mesma
aquisição/painel: casamento por `content_guid`, fallback `file_name`),
mas não existe entrada na UI. Sem ela, quem recebe "a análise do
orientador em outro experimento" continua refazendo o gating na mão — ou
pior, mantendo "analise_final_v2.zip" por fora.

## Escopo

### 1. Entrada no card/menu do experimento

Ação "Derivar análise de…" no menu ⋮ do card do experimento (listagem) —
experimento **alvo** é o card onde a ação foi aberta. Também aceitável no
menu do workspace, se o encaixe for mais natural.

### 2. Diálogo de derivação

- Seletor do experimento **origem**: lista os experimentos visíveis
  (`GET /experiment/`), excluindo o alvo. Mostrar título + workspace/grupo
  para desambiguar.
- Checkboxes: "Copiar subsamples homônimos" (`include_subsamples`,
  default on) e "Copiar compensação aplicada" (`include_compensation`,
  default on).
- Submit: `POST /experiment/<alvo>/derive-analysis/` com
  `{source_experiment_id, include_subsamples, include_compensation}`.

### 3. Relatório pós-derivação

A resposta traz `matched_files`, `created_gates`, `skipped_files`,
`unmatched_source_files`, `unmatched_target_files`, `subsamples_created`,
`compensation_applied` — mostrar como resumo no diálogo (ou toast
expansível): "X amostras casadas, Y gates criados; Z amostras da origem
sem par no alvo; W amostras puladas por já terem análise". Erros 400/403
viram `detail` no diálogo.

### 4. Invalidação

Após sucesso, invalidar as queries da árvore/dados do experimento alvo
(TanStack Query) para a análise derivada aparecer sem reload.

## Arquivos a tocar

- `src/services/` — função `deriveAnalysis(targetId, payload)`.
- `src/features/experiment/` (ou onde moram os menus do card) — diálogo.
- Invalidação: mesmas query keys usadas por `useExperimentData`/árvore.

## Critérios de aceite

- [ ] Diálogo acessível pelo card do experimento alvo
- [ ] Lista de origens exclui o alvo e mostra workspace
- [ ] Resumo do relatório exibido após sucesso (matched/skipped/unmatched)
- [ ] Árvore do alvo reflete os gates derivados sem reload
- [ ] Erro de permissão/validação aparece como `detail` legível

## Fora de escopo

- Mergear análise derivada com análise existente (alvo com gates pula a
  amostra — o relatório mostra; merge fino é BE-23/FE-29).
- Derivar como branch separada (backend v1 vai sempre para a `main`;
  `as_branch` é evolução futura).
- Catálogo de templates persistidos (BE-19 workspace/template é visão).
