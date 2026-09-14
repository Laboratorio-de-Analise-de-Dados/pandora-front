# FE-22 — Erro real e pré-checagem de canais no plot

**Repo:** pandora-front · **Item do doc:** teste 14/09/2026, item 2 · **Tipo:** fix · **Base:** `main`
**Branch sugerida:** `fix/density-missing-channel` · **Depende de:** BE-18 (contrato de erro)
**Status:** implementado em `fix/density-missing-channel`.

## Problema

Quando `/density` falha, o plot mostra apenas "Erro ao carregar dados."
(`scatter-plot/index.tsx`, `isError && !data`). O `detail` do backend — que já
diz a causa — é descartado. No teste de 14/09 o usuário ficou sem saber se era
bug ou arquivo ruim; a resposta era canal inexistente na amostra.

O front já conhece os canais da amostra (`values`, que alimenta o `AxisSelect`)
— não precisa esperar o 400 para saber que `FITC-A` não existe ali.

## Escopo

1. **Exibir o `detail` do backend** no lugar da mensagem genérica (fallback para
   o texto atual quando não houver `detail`), reutilizando
   `extractErrorMessage` como nos toasts de `useGateMutations`.
2. **Pré-checagem local:** se o canal pedido (X ou Y) não está em `values` da
   amostra selecionada, não chamar a API — mostrar aviso do tipo
   `"Esta amostra não possui o canal FITC-A"` no lugar do plot.
3. **Não quebrar a troca de amostra:** com canais preservados (ADR-0005), ao
   cair numa amostra sem o canal o aviso aparece no plot e o usuário troca o
   eixo pelo `AxisSelect` — que já só lista canais existentes.
4. Dataset vazio (BE-18 passa a devolver 200 com `total_events: 0`) → renderizar
   o plot vazio/legenda "0 eventos", não tela de erro.
5. **Sinalização permanente de gate não aplicável** (BE-18 grava
   `applicable: false` + `missing_channels` no `analysis_result`): a árvore e o
   relatório mostram o estado em vez de stat — "—" nos números + ícone de
   alerta (⚠/`MdWarningAmber`) com tooltip nomeando os canais ausentes.
   Descendentes herdam (o backend já marca a subárvore). A amostra com gates
   não-avaliáveis pode ganhar o mesmo ⚠ na linha do arquivo, para o problema
   ser visível com a árvore fechada.
6. **Aviso no apply:** quando a response do `ApplyGateView` (ou do `dry_run`)
   trouxer `non_evaluable`, a confirmação/toast do apply avisa — "ES488837.fcs
   não possui FITC-A/APC-A; os gates aplicados ficarão não avaliáveis nessa
   amostra" — em vez de só contar conflitos de nome.

## Estrutura

- `src/features/plot/components/scatter-plot/index.tsx` — ramo de erro com
  mensagem real + estado "canal ausente".
- `src/features/plot/hooks/useDensityQuery.ts` — decidir entre skip da query
  (canal ausente) e erro real da API.
- `src/services/densityService.ts` — propagar o erro com `detail` legível
  (padrão `extractErrorMessage`).
- `src/features/experiment/components/parent-tree/GateTreeItem.tsx` (e o
  `StatsPanel`, se ele renderizar stats de gate) — render do estado
  `applicable: false` com ⚠ + tooltip.
- Fluxo de apply (diálogo de confirmação + toast) — exibir `non_evaluable`
  da response.

## Critérios de aceite

- [ ] Amostra sem o canal pedido → aviso nomeando o canal, sem request à API.
- [ ] Falha real da API → `detail` do backend visível, não a frase genérica.
- [ ] Gate com 0 eventos → plot vazio com contagem, sem tela de erro.
- [ ] Gate marcado não-aplicável → árvore/relatório com ⚠ e causa acessível,
      sem número fictício.
- [ ] Apply para amostra sem o canal → aviso listando amostra e canais, antes
      (`dry_run`) e/ou depois de confirmar.
- [ ] Trocar para amostra que tem o canal volta a renderizar normalmente.

## Fora de escopo

- Seleção automática de canal substituto ("adivinhar" o equivalente na amostra)
  — decisão de produto, depende da discussão de painel por amostra do BE-18.
