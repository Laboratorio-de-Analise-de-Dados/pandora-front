# FE-14 — Seleção múltipla de amostras e metadados do header FCS

**Repo:** pandora-front · **Tipo:** feature · **Base:** `refactor/node-26-upgrade`
**Status:** entregue na branch `refactor/node-26-upgrade` (commit `21b480f`),
PR pendente. Complementa [FE-11](FE-11-subsamples.md) e depende do
[BE-09](../../../pandora-backend/docs/prd/BE-09-headers-fcs.md) para os metadados.

## Problema

Duas fricções na árvore do experimento:

1. Mover amostras para um subsample era uma a uma — organizar um experimento
   com dezenas de arquivos exigia repetir menu ⋮ → "Mover" para cada arquivo.
2. O backend já salva o header FCS completo em `FileDataModel.headers`
   (data de aquisição, equipamento, operador, total de eventos), mas o front
   não tinha como exibir — o usuário não consegue conferir "quando/de onde
   veio este arquivo" sem abrir o FCS em outra ferramenta.

## Escopo

### 1. Seleção múltipla e mover em lote

- Checkbox em cada nó de amostra, só quando há permissão de edição
  (`onMoveFile` presente, condicionado a `canEditExperiment`).
- Com seleção ativa, chip "Mover N" no header da árvore abre o diálogo de
  destino; o × do chip limpa a seleção.
- `MoveFileDialog` aceita 1 ou N amostras: o menu ⋮ individual continua
  funcionando (delega a mesma lista com um item).
- Destino: qualquer subsample ativo ou "Sem subsample" (`null`). O valor
  inicial do select é o subsample comum entre as selecionadas (vazio se
  divergirem).
- Execução: `Promise.allSettled` sobre o `PATCH` por amostra (a API é magra —
  ADR-0011 do backend), **uma** invalidação ao final, toast com contagem em
  falha parcial.

### 2. Metadados do header FCS

- Ícone ℹ em cada amostra (sempre visível, leitura não exige permissão de
  edição) abre `FileMetadataDialog`.
- Fetch sob demanda ao abrir: `GET /experiment/file/<id>/headers` via
  `fetchFileHeaders` em `services/experimentService.ts`.
- `date` e `cyt` sobem como chips no cabeçalho do diálogo; demais campos
  conhecidos com label amigável (`btim`/`etim`, `op`, `tot`, `plate id`,
  `well id`, ...); keywords restantes atrás de "Ver todos os campos (N)" —
  o backend persiste as chaves minúsculas e sem `$`, como o `readfcs` emite —
  nada do header é descartado na UI.
- Estados: carregando, erro ("Não foi possível carregar") e header sem campos
  conhecidos (aponta para a lista completa).

## Arquivos a tocar

- `src/components/parent_tree/index.tsx` — `selectedFileIds`, checkbox no
  label da amostra, chip "Mover N", ícone ℹ, `moveTargets` como lista.
- `src/components/parent_tree/dialogs.tsx` — `MoveFileDialog` generalizado
  para lista + `FileMetadataDialog` novo (mapa `HEADER_LABELS`).
- `src/services/experimentService.ts` — `fetchFileHeaders` +
  `FileHeadersResponse`.
- `src/features/experiment/hooks/useExperimentPageActions.ts` —
  `handleMoveFileToSubsample` recebe `number[]` e orquestra o lote.

## Critérios de aceite

- [x] Selecionar várias amostras e mover todas de uma vez para subsample ou
      "Sem subsample"; a listagem reflete sem recarregar.
- [x] Falha parcial informa "X movidas, Y falharam" sem perder o estado.
- [x] Mover amostra única pelo menu ⋮ continua funcionando (mesmo diálogo).
- [x] Diálogo de metadados mostra data, equipamento e total de eventos quando
      presentes, com acesso à lista bruta completa.
- [x] Checkbox/mover só com permissão de edição; ℹ visível para leitura.
- [x] Nenhuma chamada de API fora de `services/` (ADR-0001).
- [ ] Verificação manual contra backend real na `chore/ai-setup` (BE-09).

## Fora de escopo

- Endpoint de lote no backend (decisão registrada no ADR-0011 do backend;
  revisitar se o volume por experimento crescer).
- Edição de metadados ou colunas de header na tabela/listagem.
- Seleção de amostras por grupo inteiro (checkbox no nó do subsample).
