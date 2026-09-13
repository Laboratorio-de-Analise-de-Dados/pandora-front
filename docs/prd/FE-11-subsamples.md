# FE-11 — Subsamples na UI: agrupar, renomear e remanejar amostras

**Repo:** pandora-front · **Item do doc:** — (levantado em 12/09) · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/subsamples-ui`
**Status:** não iniciado. Depende do backend `pandora-backend/docs/prd/BE-07-subsamples.md` (PR #78).

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
- **Bloqueado** até a parte 2 do BE-07 existir na API.

## Arquivos a tocar

- `src/services/subsampleService.ts` (novo) — `fetchSubsamples`, `createSubsample`,
  `renameSubsample`, `archiveSubsample`, `moveFileToSubsample` + tipagens.
- `src/hooks/useSubsamples.ts` (novo) — estado, loading/erro, invalidação da
  listagem de amostras após mover/arquivar.
- `src/components/parent_tree/index.tsx` — reestruturar para 3 níveis e
  substituir `@mui/x-tree-view` por componente próprio (desacoplar dep, FE-13).
- Diálogos de escopo existentes.
- Testes dos hooks.

## Critérios de aceite

- [ ] Amostras aparecem agrupadas por subsample, com contagem, e a raiz do ZIP
      cai em "Sem subsample".
- [ ] Criar, renomear e arquivar subsample pela UI; nome duplicado mostra o erro
      da API no campo.
- [ ] Mover amostra entre subsamples e para "Sem subsample", com a listagem
      atualizada sem recarregar a página.
- [ ] Arquivar subsample não remove nenhuma amostra da listagem.
- [ ] Filtro "mostrar inativos" exibe subsamples arquivados.
- [ ] Layout mobile-first (ADR-0002): grupos colapsáveis no `xs`, sem overflow
      horizontal.
- [ ] Nenhuma chamada de API fora de `services/` (ADR-0001).
- [ ] Escopo "deste subsample" nos diálogos — **após** a parte 2 do BE-07.

## Fora de escopo

- Reordenar subsamples manualmente.
- Amostra em mais de um subsample.
- Criar subsample a partir de metadado do FCS.
