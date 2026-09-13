# ADR-0010 — Orquestração de lote e metadados no cliente

- **Status:** Aceito
- **Data:** 2026-09-13
- **Contexto do código:** `src/components/parent_tree/` (`index.tsx`,
  `dialogs.tsx`), `src/features/experiment/hooks/useExperimentPageActions.ts`,
  `src/services/experimentService.ts` (`fetchFileHeaders`)

## Contexto

O FE-14 trouxe duas demandas sobre a árvore do experimento: mover várias
amostras para um subsample de uma vez, e exibir metadados do header FCS. As
duas esbarram no mesmo ponto de desenho: a API de arquivo do backend é magra
(um PATCH por amostra; headers servidos crus por arquivo — ADR-0011 do
pandora-backend), então a inteligência do "lote" e da apresentação tem que
morar em algum lugar do front.

## Decisão

O cliente orquestra, em três camadas distintas:

- **Seleção é estado local do componente** (`selectedFileIds: Set<number>` no
  `ParentTree`), não entra no `ExperimentWorkspaceContext` nem no TanStack
  Query — é efêmera, não sobrevive a refetch e não interessa fora da árvore.
- **Lote no hook de ações**: `handleMoveFileToSubsample` recebe `number[]` e
  dispara `Promise.allSettled` sobre o service por amostra, com **uma**
  `invalidateExperiment()` ao final — não uma por chamada. Falha parcial é um
  estado de primeiro mundo: toast com a contagem, e o refetch reconcilia o
  que sobrou.
- **Metadados sob demanda**: `FileMetadataDialog` busca o header só ao abrir
  (`fetchFileHeaders` no mount do diálogo), fora do payload da listagem. A
  apresentação é uma tabela de labels curada (`HEADER_LABELS`) sobre o dict
  bruto, com fallback "ver todos os campos" — o mapa vive no componente, não
  num service, porque é cosmético e não contrato.

## Alternativas consideradas

### A) Endpoint de lote no backend

Descartada em conjunto com o backend (ADR-0011 lá). Para o volume típico
(dezenas de amostras) o paralelismo do `allSettled` resolve; o endpoint bulk
só volta à mesa se precisarmos de atomicidade ou se o volume crescer.

### B) Headers no payload de `GET experiment/<id>/files` ou no TanStack Query

Descartada. O dict de headers é grande por arquivo; embutir na listagem
inflaria cada refetch da tela inteira. Uma `useQuery` por arquivo também
funcionaria, mas o fetch local no diálogo é mais simples e suficiente — o
dado não é compartilhado entre componentes.

### C) Estado de seleção no contexto do workspace

Descartada. Subiria estado efêmera para a camada que serve a página inteira,
invalidaria o que não precisa e criaria acoplamento desnecessário — a regra
de dependência do ADR-0008 já empurra estado de UI para o componente.

## Consequências

- Padrão para futuros lotes: service por item + `allSettled` no hook +
  invalidação única. Não criar N invalidações escondidas em loop.
- Falha parcial vira responsabilidade do hook — quem chama o service recebe
  sempre o agregado, nunca trata `Promise` individual.
- `HEADER_LABELS` é a lista única de keywords FCS "conhecidos" do front;
  campo novo do citômetro aparece na lista bruta sem deploy, e promovê-lo a
  label amigável é editar um mapa.
- **Dívida:** sem endpoint bulk, lotes muito grandes geram rajada de
  requests; se isso doer, a decisão muda no backend primeiro (ADR-0011 lá
  registra a revisitação).
