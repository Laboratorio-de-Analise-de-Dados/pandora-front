# FE-06 — Manter a seleção de canais ao trocar de amostra

**Repo:** pandora-front · **Item do doc:** 11 · **Tipo:** bug · **Base:** `main`
**Branch sugerida:** `fix/keep-channels-on-file-switch`
**Status:** Entregue no PR #38.

## Causa raiz (identificada)

`src/components/page/experiment/[id]/index.tsx`:

```tsx
<PlotStateProvider
  key={`${source.type}-${source.id}`}
  initialConfig={{
    ...viewConfig,              // carry-forward em memória (o que o usuário escolheu)
    ...selectedGate?.plot_config, // config salva no gate → SOBRESCREVE o carry-forward
  }}
```

O `plot_config` do gate destino tem precedência sobre a config atual. Isso explica exatamente o relato do doc ("aparentemente apenas quando existem gates no canal"): se a amostra destino tem gate com `plot_config` salvo (eixos antigos), ao trocar de amostra os eixos voltam para o que foi salvo naquele gate, descartando a escolha do usuário.

Complicação secundária: `usePlotState.handleSelectX/handleSelectY` limpam `xMin/xMax` e resetam a escala ao trocar de canal — correto ao trocar canal, mas reforça a sensação de "perdi tudo" quando a troca vem de fora.

## Escopo

Definir e implementar a regra de precedência (estilo FlowJo: a config **corrente** ganha ao navegar entre amostras; a config do gate só entra quando o gate é selecionado explicitamente pela árvore):

1. Distinguir os dois gatilhos de troca de fonte: navegação entre arquivos (`goToAdjacentFile`) vs seleção explícita na árvore (`setSource` a partir do `parent_tree`).
2. Navegação entre arquivos → manter `viewConfig` (eixos, escalas, limites, modo), ignorando `plot_config` do gate destino.
3. Seleção explícita de um gate → aplicar o `plot_config` salvo dele (comportamento atual).
4. Manter o `key` do `PlotStateProvider` coerente com a decisão, para o estado não ser recriado à toa.

Sugestão de implementação: mover essa decisão para o `ExperimentWorkspaceContext` (que já é o dono de `viewConfig` e do `goToAdjacentFile`), expondo o `initialConfig` já resolvido em vez de compor o spread no componente de página.

## Arquivos a tocar

- `src/features/experiment/context/ExperimentWorkspaceContext.tsx`
- `src/components/page/experiment/[id]/index.tsx`
- `src/features/plot/context/PlotStateContext.tsx` (se precisar de ajuste de `key`)

## Critérios de aceite

- [ ] Selecionar CD3 x CD4 na amostra A e navegar para B (setas de arquivo) → B abre em CD3 x CD4, inclusive quando B tem gates com `plot_config` salvo.
- [ ] Escala e limites manuais também são preservados nessa navegação.
- [ ] Clicar num gate específico na árvore → abre com a config salva daquele gate.
- [ ] `plot_config` continua sendo persistido no backend ao editar a visualização de um gate (`usePlotPersistence` intacto).
