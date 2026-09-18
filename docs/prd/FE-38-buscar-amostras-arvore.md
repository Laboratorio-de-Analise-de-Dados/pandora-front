# FE-38 — Buscar amostras na árvore do workspace

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/fe-38-buscar-amostras`
**Status:** em andamento.
**Origem:** follow-up registrado no FE-26 (campo "buscar amostras" do painel
esquerdo ficou fora do refactor visual). Card Trello #50.

## Problema

Em experimento com muitas amostras (caso real: 64 arquivos de placa) achar
uma amostra na árvore é scroll puro. As tags do BE-34/FE-34 ajudam a
identificar, mas não há como filtrar — a pessoa caça o nome na lista.

## Escopo

### 1. Campo de busca no painel da árvore

- `TextField` outlined `size="small"` abaixo da barra de ações do
  `ParentTree`, com ícone de busca e botão de limpar (✕) quando há texto.
  Ocupa a largura do painel; funciona igual no desktop (painel lateral) e
  no mobile (bottom sheet).
- Filtragem instantânea (a cada tecla), sem submit — a lista já está em
  memória, não tem chamada de API.

### 2. O que a busca casa

Texto livre, case-insensitive e **sem acento** (normalização NFD):

- `file_name` da amostra;
- nome das tags da amostra (`tags` + `inherited_tags` — buscar "fmo" acha
  a amostra etiquetada, não só a que tem "fmo" no nome);
- nome do **subsample**: casar o grupo inteiro (mostra todas as amostras
  dele).

Não casa: gates (a busca é de amostras), `suggested_tags` (system_key não
é texto visível), metadados de header.

### 3. Resultado

- Grupo subsample sem nenhuma amostra correspondente **some** da listagem
  enquanto a busca está ativa; subsample cujo nome casa mantém o grupo
  inteiro visível.
- Durante a busca os nós ficam **expandidos forçadamente** — resultado
  dentro de grupo recolhido não pode ficar invisível. Ao limpar, volta o
  estado de expansão do usuário.
- Contador "N de M amostras" sob o campo enquanto filtra; sem
  correspondência: "Nenhuma amostra encontrada."
- O filtro é só visual: seleção em lote, menus e desabilitar/reativar
  continuam valendo sobre as amostras visíveis.

## Arquivos a tocar

- `src/features/experiment/utils/treeFilter.ts` (novo) — `normalizeQuery`,
  `fileMatchesQuery`, `filterGroupsByQuery` — puro, testável (ADR-0008).
- `src/features/experiment/utils/treeFilter.test.ts` (novo) — casos de
  acento, tag, subsample e grupo vazio.
- `src/features/experiment/components/parent-tree/index.tsx` — estado
  `query`, campo de busca, contagem e estado vazio.
- `src/features/experiment/components/parent-tree/types.ts` —
  `forceExpanded` no `TreeHandlers`.
- `TreeNode.tsx`, `FileTreeItem.tsx`, `SubsampleGroupItem.tsx` —
  propagação do `forceExpanded`.

## Critérios de aceite

- [ ] Digitar filtra as amostras por nome, tag e subsample, sem acento/case
- [ ] Buscar nome de subsample mostra o grupo inteiro
- [ ] Resultados dentro de grupos recolhidos aparecem (expansão forçada)
- [ ] Limpar restaura a árvore e o estado de expansão anterior
- [ ] Estado vazio com mensagem clara; contador visível durante o filtro
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build` limpos

## Fora de escopo

- Buscar por gate ou por metadado de header FCS.
- Highlight do trecho casado no label.
- Persistir a última busca entre sessões.
- Busca na listagem de experimentos (`/experiments`) — superfície
  diferente, pedido próprio se doer.
