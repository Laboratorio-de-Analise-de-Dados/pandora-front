# FE-08 — Percentuais do relatório devem corresponder ao parent

**Repo:** pandora-front · **Item do doc:** 12 · **Tipo:** bug · **Base:** `main`
**Branch sugerida:** `fix/report-parent-percentages`
**Status:** Entregue no PR #46.

## Situação

O backend calcula as duas métricas corretamente (`analytics/tasks.py::calculate_cytometry_metrics`):

- `percent_of_total_population` = eventos do gate / eventos do arquivo
- `percent_of_parent_population` = eventos do gate / eventos do **parent** (0 quando não há parent)

E o front já tem as duas em todos os lugares (`StatsSummaryCard`, `ComparisonPanel`, `parent_tree`, `GateEditDialog`, `statsRows.ts`). Então o item é provavelmente **rótulo/coluna trocada ou ordem errada no export**, não cálculo.

Pontos a checar:

- `src/features/stats/utils/statsRows.ts` linhas ~47-48 — ordem das colunas no export vs cabeçalho declarado.
- `src/features/stats/components/ExportDialog.tsx` — colunas selecionadas.
- `src/features/plot/hooks/useGateShapes.ts:95` — o rótulo mostrado sobre o gate no plot usa `percent_of_parent_population`; conferir se é o que o usuário espera ver ali (FlowJo mostra %P).
- Arquivo-raiz: `FileStatsView` devolve `percent_of_parent_population: 1.0` para o arquivo inteiro; conferir se o relatório não está tratando isso como "100% do parent" num contexto errado.
- Gate raiz (sem parent): backend devolve 0 — o front deve exibir `—` / `100%` conforme a convenção escolhida, não `0,00%`.

## Escopo

1. Reproduzir com um experimento real e anexar no MR o print do relatório com os números conferidos à mão (contagem do parent).
2. Corrigir o que estiver trocado e rotular explicitamente as colunas: `% do parent (%P)` e `% do total (%T)`.
3. Definir e aplicar a convenção para gate raiz.

## Critérios de aceite

- [ ] Para um gate filho, `%P` = count(filho)/count(parent) confirmado à mão.
- [ ] Colunas do export batem com o cabeçalho e com o que a tela mostra.
- [ ] Gate raiz exibe a convenção acordada, não `0,00%`.
- [ ] Painel de comparação e card de stats mostram os mesmos números que o export para o mesmo gate.
