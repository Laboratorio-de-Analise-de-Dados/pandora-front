# FE-11 — Subsamples na UI: agrupar, renomear e remanejar amostras

**Repo:** pandora-front · **Item do doc:** — (levantado em 12/09) · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/subsamples-ui`
**Status:** em andamento — árvore agrupada, gestão (criar/renomear/arquivar/mover) e escopo `"subsample"` entregues em `refactor/node-26-upgrade`. Backend entregue em `pandora-backend/docs/prd/BE-07-subsamples.md` (PR #78, mergeado).

## Problema

O backend passou a organizar as amostras de um experimento em **subsamples**
(um por diretório do ZIP: `tempo_1/`, `tempo_2/`, ...), mas a UI continua
mostrando uma lista plana de arquivos pelo basename. Sem a UI:

- o usuário não vê que `a1.fcs` de `tempo_1` e de `tempo_2` são amostras
  diferentes;
- a engine é a única a decidir o agrupamento, embora a decisão seja do cliente;
- não há como escolher "aplicar nas amostras deste subsample" nos diálogos de
  escopo.

## Escopo

### 1. Árvore de amostras agrupada

- A árvore hoje (`src/components/parent_tree/index.tsx`) mostra arquivos e
  gates, sem o conceito de subsample — o nível "subsample" é novo entre
  experimento e amostra.
- A lista de amostras do experimento passa a ser agrupada por subsample, com o
  nome do subsample e a contagem (`files_count`).
- A reestruturação é o momento de trocar `SimpleTreeView`/`TreeItem`
  (`@mui/x-tree-view`) por um componente próprio: a árvore vira 3 níveis
  (subsample → amostra → gate) com nós heterogêneos, e é o único uso restante
  dos pacotes `@mui/x-*` (ver FE-13). Menus, diálogos e tooltip continuam MUI.
- **Entregue (13/09/2026, `refactor/node-26-upgrade`):** `TreeNode` próprio
  substituiu `@mui/x-tree-view`; `groupFilesBySubsample` (util puro testado)
  agrupa por `file.subsample`; o nível subsample só aparece quando a API envia
  o campo — sem ele, renderiza flat como antes.
- Amostras sem subsample (arquivo na raiz do ZIP) ficam em um grupo
  **"Sem subsample"**, que não é um subsample de verdade — não pode ser
  renomeado nem inativado.
- Subsamples inativos aparecem só com o filtro "mostrar inativos"
  (`include_inactive=true`), no mesmo padrão do filtro de amostras desabilitadas
  do FE-04.

### 2. Gerenciar subsample

- Criar subsample (nome obrigatório, erro 400 de nome duplicado exibido no
  campo).
- Renomear inline; `source_path` é exibido como contexto read-only ("veio de
  `tempo_1/`").
- Arquivar (inativar) com confirmação explicando que as amostras **não** são
  apagadas, apenas ficam sem subsample.

### 3. Mover amostra

- Ação "mover para..." na amostra, com select dos subsamples ativos +
  "Sem subsample" (`null`).
- Mobile: bottom sheet/menu; desktop: menu de contexto na linha. **Não** usar
  drag-and-drop como único caminho (inacessível no mobile); se entrar, é atalho
  redundante.

### 4. Escopo de análise por subsample

- Os diálogos de escopo (nome/cor, exclusão em lote, reshape) ganham a opção
  "nas amostras deste subsample", entre "apenas nesta amostra" e "em todas".
- A opção só aparece quando a amostra atual tem subsample.
- Continua valendo o `dry_run` antes de sobrescrever (ADR-0004).

## Arquivos a tocar

- `src/services/subsampleService.ts` (novo) — ✅ `fetchSubsamples`, `createSubsample`,
  `renameSubsample`, `archiveSubsample`, `moveFileToSubsample`.
- `useSubsamplesQuery` em `src/features/experiment/hooks/useExperimentData.ts` +
  `subsamples` no `ExperimentWorkspaceContext` — ✅ (hook separado
  `useSubsamples.ts` virou desnecessário com o contexto do workspace).
- Handlers em `useExperimentPageActions` — ✅ create/rename devolvem erro para
  o campo; archive/move toasteiam e invalidam.
- `src/components/parent_tree/index.tsx` — ✅ reestruturado (3 níveis,
  `TreeNode` próprio, `@mui/x-tree-view` removido).
- Diálogos de escopo existentes.
- Testes dos hooks.

## Critérios de aceite

- [x] Amostras aparecem agrupadas por subsample, com contagem, e a raiz do ZIP
      cai em "Sem subsample".
- [x] Criar, renomear e arquivar subsample pela UI; nome duplicado mostra o erro
      da API no campo (aguarda verificação manual).
- [x] Mover amostra entre subsamples e para "Sem subsample", com a listagem
      atualizada sem recarregar a página (idem).
- [x] Arquivar subsample não remove nenhuma amostra da listagem (DELETE do BE-07
      inativa e desvincula).
- [x] Filtro "mostrar inativos" exibe subsamples arquivados (`include_inactive`
      segue o toggle de amostras).
- [ ] Layout mobile-first (ADR-0002): grupos colapsáveis no `xs`, sem overflow
      horizontal.
- [x] Nenhuma chamada de API fora de `services/` (ADR-0001).
- [x] Escopo "deste subsample" nos diálogos de nome/cor, exclusão em lote e
      reshape — aparece só quando a amostra atual tem subsample; `dry_run`
      continua valendo (ADR-0004).

## Fora de escopo

- Reordenar subsamples manualmente.
- Amostra em mais de um subsample.
- Criar subsample a partir de metadado do FCS.
