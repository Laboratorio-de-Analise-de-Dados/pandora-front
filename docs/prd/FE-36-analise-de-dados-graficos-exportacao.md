# FE-36 — Análise de dados: gráficos comparativos e export de imagem

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/data-analysis-charts`
**Status:** não iniciado.
**Decisão 2026-09:** escopo em duas fases — fase 1 (gráficos + export) no
v1; fase 2 (testes estatísticos entre grupos) quando existir modelo de
agrupamento de réplicas (ver "Fora de escopo").

## Problema

Hoje toda a saída analítica do Pandora é **tabela**: o `StatsPanel`
mostra mean/median MFI, std, CV e % do pai por população, e o
`ComparisonPanel` compara amostras — em linhas de texto. O export
(`ExportDialog`) sai em CSV/XLSX. O resultado prático fora do sistema
continua sendo o mesmo de sempre: o citometrista exporta a tabela e
refaz os gráficos no Prism/Excel para o relatório.

Gráfico comparativo (% gated por amostra, MFI por canal, distribuições
sobrepostas) com export de imagem é o que as plataformas pagas
(Cytobank, OMIQ) vendem como "figures/illustrations" — e é o diferencial
que o PRD de produto quer no v1.

## Escopo

### Fase 1 — gráficos + export (v1)

#### 1. Área de análise

- Nova rota/página de análise por experimento (entrada pelo workspace —
  botão na barra ou item no menu — ou aba nova, o que encaixar melhor no
  layout). Referência de composição: a tela de Experimentos é o modelo
  de página "ferramenta" (largura total, conteúdo ancorado topo-esquerdo).
- Contexto da página: experimento corrente. Fonte de dados: a árvore já
  carregada (`useExperimentFilesQuery`) — gates trazem
  `analysis_result` embutido; amostras sem gate usam `fetchFileStats`
  (mesmo contrato do `useComparisonStats`).

#### 2. Gráfico comparativo de estatísticas

- Eixo X = amostras (ou subsamples); séries = populações selecionadas
  (gates homônimos por caminho de nomes, como o `goToAdjacentFile` já
  resolve entre amostras).
- Métricas: % do pai, % do total, mean/median MFI por canal —
  reutilizar o vocabulário de `src/features/stats/utils/statsRows.ts`.
- Tipos: barras agrupadas (default) e pontos individuais (strip) — o
  citometrista quer ver a dispersão das réplicas, não só a barra.
- Populações não-avaliáveis numa amostra seguem a regra do export
  (`buildAnalysisRows`): ausência, não zero.

#### 3. Distribuição sobreposta

- Histograma/densidade de um canal para N amostras ou gates sobrepostos
  (transparência por série) — dados do `densityService` já paginado;
  respeitar a compensação aplicada (mesma cache key do plot).
- Casos de uso: "o CD3 do gate T nas 6 amostras", "FSC-A de todas".

#### 4. Export de imagem

- PNG e SVG via `Plotly.toImage` (Plotly já é dependência — não adicionar
  lib de canvas). Botão "Exportar figura" por gráfico; nome default
  `<experimento>-<populacao>-<metrica>.png`.
- Export da tabela de dados da figura em CSV reutilizando
  `exportRows`/`downloadFile` de `src/features/stats/utils/exportHelpers.ts`.

### Fase 2 — estatística entre grupos (documentada, sem implementação)

- ANOVA one-way (`scipy.stats.f_oneway` no backend — scipy já é
  dependência) ou Kruskal-Wallis sobre % do pai / MFI entre **grupos de
  réplicas**, com post-hoc e correção de múltiplas comparações.
- **Pré-requisito que falta hoje**: modelo de agrupamento — "quais
  amostras são réplicas de qual condição". Candidatos: subsamples como
  grupos naturais, tags/pistas de placa do BE-26 (PRD em revisão),
  FE-34/35 (controles). Definir no PRD próprio da fase 2.
- p-valor sem pressuposto checado é dado errado bonito — não shippar
  teste sem exibir n por grupo e aviso de pressupostos (normalidade/
  variância) ou usar não-paramétrico por default.

## Arquivos a tocar (fase 1)

- `src/features/analysis/` (nova) — `hooks/` (`useAnalysisChartData`),
  `components/` (`StatsChart`, `DistributionChart`, `FigureExportButton`),
  `utils/` (montagem de séries — puro, testável).
- `src/services/` — reutilizar `fetchFileStats`, `densityService`; nada
  novo esperado na fase 1.
- `src/page/` — página/rota nova ou integração no workspace
  (`page/experiment/[id]`).
- `src/components/` — entrada de navegação (menu/botão conforme o
  encaixe escolhido).

## Critérios de aceite (fase 1)

- [ ] Página de análise acessível a partir do workspace do experimento
- [ ] Gráfico de stats: selecionar população + métrica + canal → série
      por amostra (barras e pontos)
- [ ] Amostra sem o gate aparece como ausente, não como zero
- [ ] Distribuição: sobrepor ≥3 amostras/gates num canal com legenda
- [ ] Export PNG/SVG produz arquivo com título/legendas legíveis
- [ ] Export CSV da figura bate com os dados plotados
- [ ] Tudo TanStack Query; gráficos em Plotly (nenhuma lib nova)

## Fora de escopo

- **Testes estatísticos (ANOVA e afins)** — fase 2, PRD próprio quando o
  agrupamento de réplicas existir (BE-26/FE-34/35 são os candidatos a
  fornecer os grupos).
- Editor de figura (layout, fontes, anotações) — export é da figura
  renderizada, sem customização editorial.
- Análise cross-experimento (comparar amostras de experimentos
  diferentes) — a derivação (FE-28) e cópia resolvem o caso "mesma
  aquisição"; cross-experimento real é visão futura.
- Export do plot de gating (scatter/density do workspace) — já coberto
  pelo botão nativo do Plotly se quiserem habilitar; não é esta entrega.
