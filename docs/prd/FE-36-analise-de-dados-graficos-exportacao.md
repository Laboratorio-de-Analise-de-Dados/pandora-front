# FE-36 — Análise de dados: figuras persistidas, gráficos e export

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/data-analysis-charts`
**Status:** não iniciado.
**Dependência:** **BE-33** (`pandora-backend` PRD — `AnalysisFigure`:
spec + `result_cache` + `result_revision` + `is_stale` + `recompute/`).
**Decisão 2026-09 (rev.):** a figura é um **objeto persistido com
procedência** — não um chart efêmero. Grupos de réplicas são definidos
**por figura** no spec (pergunta de análise varia: "por dia" vs. "por
condição"); subsamples servem só de preset sugerido na UI, nunca de
binding no modelo. Fase 1 (galeria + gráficos + export) no v1; fase 2
(testes estatísticos entre grupos) usa os próprios `spec.groups` como
agrupamento — o pré-requisito de agrupamento foi resolvido pelo desenho
do BE-33.

## Problema

Hoje toda a saída analítica do Pandora é **tabela**: o `StatsPanel`
mostra mean/median MFI, std, CV e % do pai por população, e o
`ComparisonPanel` compara amostras — em linhas de texto. O export
(`ExportDialog`) sai em CSV/XLSX. O resultado prático fora do sistema
continua sendo o mesmo de sempre: o citometrista exporta a tabela e
refaz os gráficos no Prism/Excel para o relatório.

Gráfico comparativo (% gated por amostra, MFI por canal, distribuições
sobrepostas) com export de imagem é o que as plataformas pagas
(Cytobank, OMIQ) vendem como "figures/illustrations". E o requisito de
produto vai além do print bonito: a figura precisa ser **rastreável** —
responder "esses dados vieram de qual estado da análise?" — porque é ela
que vai parar no relatório.

## Escopo

### Fase 1 — figuras + gráficos + export (v1)

#### 1. Área de análise + galeria de figuras

- Nova rota/página de análise por experimento (entrada pelo workspace —
  botão na barra ou item no menu — ou aba nova, o que encaixar melhor no
  layout). Referência de composição: a tela de Experimentos é o modelo
  de página "ferramenta" (largura total, conteúdo ancorado topo-esquerdo).
- A página tem dois modos: **galeria** (lista as `AnalysisFigure` do
  experimento — nome, tipo, autor, atualização, badge de staleness) e
  **editor/viewer** de uma figura.
- Fonte de dados: a árvore já carregada (`useExperimentFilesQuery`) —
  gates trazem `analysis_result` embutido; stats de amostra via
  `fetchFileStats` (mesmo contrato do `useComparisonStats`). Os dados da
  figura salva vêm do `result_cache` do BE-33.

#### 2. Agrupamento de réplicas — decisão por figura

- O spec da figura carrega `groups: [{name, file_data_ids[]}]` — montados
  pelo usuário na UI (checkbox de amostras por grupo, grupos renomeáveis,
  amostra pode ficar fora de qualquer grupo = excluída da figura).
- **Preset "agrupar por subsample"**: botão que materializa os subsamples
  como grupos iniciais — ponto de partida que o usuário ajusta depois
  (rename, mover amostra, splitar). É guideline, não binding.
- Núcleo puro em `utils/` (ex.: `subsamplesToGroups(tree)`), testável.
- Semântica livre: duas figuras do mesmo experimento podem agrupar
  diferente — "réplicas por dia" e "réplicas por condição" coexistem.

#### 3. Gráfico comparativo de estatísticas

- Séries = populações selecionadas (gates homônimos por caminho de
  nomes, como o `goToAdjacentFile` já resolve entre amostras); eixo X =
  grupos; pontos = amostras.
- Métricas: % do pai, % do total, mean/median MFI por canal —
  reutilizar o vocabulário de `src/features/stats/utils/statsRows.ts`.
- Tipos: barras agrupadas (default) e pontos individuais (strip) — o
  citometrista quer ver a dispersão das réplicas, não só a barra.
- Populações não-avaliáveis numa amostra seguem a regra do export
  (`buildAnalysisRows`): ausência, não zero.

#### 4. Distribuição sobreposta

- Histograma/densidade de um canal para as amostras (ou gates) dos
  grupos sobrepostos (transparência por série) — dados do
  `densityService` já paginado; respeitar a compensação aplicada (mesma
  cache key do plot).
- Casos de uso: "o CD3 do gate T nas 6 amostras", "FSC-A de todas".

#### 5. Procedência e confiança

- Badge "dados atualizados" / **"desatualizada"** vindo do `is_stale`
  do BE-33: se a análise mudou depois da geração, a figura avisa e
  oferece **"Recomputar"** (`POST .../recompute/`) — o usuário controla
  quando a figura absorve dados novos; re-gating não corrompe
  silenciosamente a figura do relatório.
- Detalhe da figura exibe a revisão de origem (`result_revision` +
  data) — rastreável até a timeline (FE-30 já existe).
- Editando o `spec` (grupos/populações) a figura salva pede recompute —
  nunca regravar cache mudo no front.

#### 6. Export de imagem

- PNG e SVG via `Plotly.toImage` (Plotly já é dependência — não adicionar
  lib de canvas). Botão "Exportar figura" por gráfico; nome default
  `<experimento>-<figura>.png`.
- **Carimbo de procedência no export**: o CSV da figura inclui
  `result_revision`/`computed_at` no cabeçalho — o arquivo de saída diz
  de qual estado da análise saiu.
- Export da tabela de dados da figura em CSV reutilizando
  `exportRows`/`downloadFile` de `src/features/stats/utils/exportHelpers.ts`.

### Fase 2 — estatística entre grupos (documentada, sem implementação)

- ANOVA one-way (`scipy.stats.f_oneway` no backend — scipy já é
  dependência) ou Kruskal-Wallis sobre % do pai / MFI entre os grupos
  **da própria figura** (`spec.groups` — o modelo de agrupamento é o
  do BE-33, não precisa de modelo novo).
- p-valor sem pressuposto checado é dado errado bonito — não shippar
  teste sem exibir n por grupo e aviso de pressupostos (normalidade/
  variância) ou usar não-paramétrico por default. Comparação entre
  réplicas técnicas vs. biológicas exige o PRD próprio da fase 2.

## Arquivos a tocar (fase 1)

- `src/features/analysis/` (nova) — `hooks/` (`useFigures`,
  `useFigureSpec`), `components/` (`FigureGallery`, `FigureEditor`,
  `GroupBuilder`, `StatsChart`, `DistributionChart`,
  `FigureExportButton`), `utils/` (`groupsFromSubsamples`, montagem de
  séries — puro, testável).
- `src/services/figureService.ts` — CRUD + `recompute/` do BE-33.
- `src/page/` — página/rota nova ou integração no workspace
  (`page/experiment/[id]`).
- `src/components/` — entrada de navegação (menu/botão conforme o
  encaixe escolhido).

## Critérios de aceite (fase 1)

- [ ] Página de análise acessível a partir do workspace; galeria lista
      figuras salvas com autor e badge de staleness
- [ ] `GroupBuilder`: preset "agrupar por subsample" + edição livre de
      grupos; amostra fora de grupo não entra na figura
- [ ] Gráfico de stats: selecionar população + métrica + canal → grupos
      no eixo, pontos por amostra (barras e strip)
- [ ] Amostra sem o gate aparece como ausente, não como zero
- [ ] Distribuição: sobrepor amostras/gates dos grupos num canal com
      legenda
- [ ] Figura `is_stale` mostra badge + "Recomputar"; após recompute o
      badge some e os dados atualizam
- [ ] Export PNG/SVG legível; export CSV carimbado com a revisão de
      origem e batendo com os dados plotados
- [ ] Tudo TanStack Query; gráficos em Plotly (nenhuma lib nova)

## Fora de escopo

- **Testes estatísticos (ANOVA e afins)** — fase 2; o agrupamento já
  existe (`spec.groups`), mas a modelagem de réplicas técnicas vs.
  biológicas e os pressupostos pedem PRD próprio.
- Editor de figura (layout, fontes, anotações) — export é da figura
  renderizada, sem customização editorial.
- Análise cross-experimento (comparar amostras de experimentos
  diferentes) — `spec.groups` só aceita `file_data_ids` do próprio
  experimento; a derivação (FE-28) cobre "mesma aquisição";
  cross-experimento real é visão futura (área top-level).
- Versionamento do spec da figura (histórico de edições) — v1 guarda só
  o estado atual; a timeline da análise já cobre a mudança dos dados.
- Export do plot de gating (scatter/density do workspace) — já coberto
  pelo botão nativo do Plotly se quiserem habilitar; não é esta entrega.
