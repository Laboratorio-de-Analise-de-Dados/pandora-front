# FE-02 — Pacote de UX do plot (settings, heatmap padrão, nome do arquivo, escala em 0)

**Repo:** pandora-front · **Itens do doc:** 3, 4, 5, 14 · **Tipo:** UX · **Base:** `main`
**Branch sugerida:** `feat/plot-ux-defaults`
**Status:** Entregue no PR #40 (o #39 ficou órfão por ter base na branch do #38).

Quatro ajustes pequenos e independentes na mesma tela — vale um MR só, com um commit por item.

## Item 4 — Heatmap como visualização padrão

Hoje o default é `scatter` em dois lugares que precisam ficar coerentes:

- `src/features/experiment/context/ExperimentWorkspaceContext.tsx` → `DEFAULT_VIEW_CONFIG.plotMode: "scatter"`
- `src/features/plot/hooks/usePlotState.ts` → `useState<PlotMode>(initial?.plotMode ?? "scatter")`

Trocar os dois para `"heatmap"`. Atenção: gates já salvos têm `plot_config.plotMode` persistido e devem continuar respeitando o valor salvo — a mudança vale só para o default de quem não tem config.

## Item 3 — Configurações do gráfico não devem sobrepor o plot

`src/features/plot/components/scatter-plot/components/PlotSettingsDropdown.tsx` usa `position: "absolute"` + `zIndex: 25/30`, o que faz o painel cobrir a área do gráfico. Opções (escolher no MR):

- painel em coluna ao lado do plot no desktop (`flexDirection: { xs: "column", md: "row" }`), virando overlay/Drawer só no mobile; ou
- manter dropdown mas empurrar o layout (sem `absolute`) para o gráfico reduzir em vez de ser coberto.

Manter o comportamento mobile-first já usado no `CollapsiblePanel` (Drawer em `xs`).

## Item 5 — Manter o nome do arquivo sobre o plot

O nome da amostra deve ficar visível acima do gráfico, junto dos controles de navegação entre arquivos (`goToAdjacentFile`, em `src/components/page/experiment/[id]/index.tsx`), inclusive quando a fonte selecionada é um gate — nesse caso mostrar `arquivo › caminho do gate`. O `ExperimentFiles.file_name` já vem do `GET /experiment/list/data/<id>`.

## Item 14 — Iniciar a escala dos eixos em 0

`src/features/plot/utils/plotAxes.ts`:

```ts
const defaultRange =
  scale === "biex"
    ? [biex(-100000, cof), biex(1000000, cof)]   // ← começa negativo
    : [0, LINEAR_SLIDER_MAX]                     // ← linear já começa em 0
```

Ou seja, o problema é só o default do **biex**. Trocar o piso para `biex(0, cof)` (ou um piso configurável), garantindo que os eventos empilhados na borda (comportamento FlowJo já implementado no backend) continuem visíveis. Verificar que gates existentes com `xMin`/`xMax` salvos não mudam de posição.

## Critérios de aceite

- [ ] Abrir um arquivo sem config salva → plot já em heatmap.
- [ ] Gate com `plotMode: "scatter"` salvo → continua em scatter.
- [ ] Abrir as configurações não cobre o gráfico em desktop; em mobile abre como Drawer.
- [ ] Nome do arquivo visível acima do plot em fonte "arquivo" e em fonte "gate".
- [ ] Eixos em biex começam em 0 por padrão; limites manuais salvos continuam respeitados.
- [ ] Sem regressão de responsividade em `xs`.
