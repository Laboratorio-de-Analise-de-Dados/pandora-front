# FE-03 — Seletor unificado de nome/cor do gate + replicar nas outras amostras

**Repo:** pandora-front · **Itens do doc:** 8, 9 · **Tipo:** UX + feature · **Base:** `main`
**Branch sugerida:** `feat/gate-edit-unified` · **Depende de:** BE-04 (parâmetro `scope`)
**Status:** Entregue no PR #41.

## Problema

Item 8: trocar cor e renomear já acontecem no mesmo lugar (`GateEditDialog` + `GateContextMenu` com duas entradas distintas, "Cor" e "Renomear", que abrem o mesmo diálogo em modos diferentes). Ficou redundante — o usuário vê duas ações para um único formulário.

Item 9: a alteração vale só para o gate atual; as cópias nas outras amostras mantêm nome/cor antigos.

## Escopo

1. **Unificar** — uma única ação "Editar gate" no `GateContextMenu`, abrindo o `GateEditDialog` com nome e cor no mesmo formulário (sem "modo"). Remover o parâmetro de modo e as duas entradas do menu.
2. **Replicar** — o usuário escolhe explicitamente no diálogo (decisão de 27/08), via radio/toggle com duas opções: `Apenas nesta amostra` (default) e `Em todas as amostras do experimento`. A segunda envia `scope: "experiment"` no PATCH.
3. Após sucesso com propagação, invalidar o cache do experimento (`useInvalidateExperiment`) para a árvore de gates e o relatório refletirem os novos nomes/cores em todos os arquivos.
4. Erro 400 de colisão de nome (`detail`) exibido no diálogo, sem fechar o formulário.

## Estrutura

- `src/services/gateService.ts` — `GateUpdatePayload` ganha `scope?: "file" | "experiment"`; tipar o retorno com `propagated_gate_ids`.
- `src/features/plot/hooks/useGateMutations.ts` — expõe a ação de update com propagação e trata invalidação/erro. Componente não chama serviço direto.
- `src/features/plot/components/scatter-plot/components/GateEditDialog.tsx` — formulário unificado.
- `src/features/plot/components/scatter-plot/components/GateContextMenu.tsx` — uma ação só.
- `src/components/plotly/index.tsx` — remover `handleContextMenuColor`/`handleContextMenuRename` duplicados, deixando um `handleContextMenuEdit`.

## Critérios de aceite

- [ ] Menu de contexto do gate tem uma única ação de edição, que abre nome + cor juntos.
- [ ] Salvar com `Apenas nesta amostra` (default) → só o gate atual muda (verificar nas outras amostras).
- [ ] Salvar com `Em todas as amostras` → nome e cor iguais nas cópias das outras amostras, sem refresh manual.
- [ ] A opção escolhida fica visível antes de salvar (nunca propagar sem o usuário ver).
- [ ] Colisão de nome → mensagem no diálogo, formulário aberto, nada alterado.
- [ ] Diálogo usável em `xs`.
