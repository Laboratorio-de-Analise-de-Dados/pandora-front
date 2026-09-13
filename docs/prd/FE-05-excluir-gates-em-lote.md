# FE-05 — Excluir gates aplicados nas outras amostras

**Repo:** pandora-front · **Item do doc:** 7 · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/bulk-delete-gates` · **Depende de:** BE-03
**Status:** Entregue no PR #44 (o #43 ficou órfão por ter base na branch do #42).

## Escopo

Espelhar o fluxo de `apply_gate_dialog` para exclusão em lote.

- Nova ação no menu de contexto do gate: `Excluir gate…`.
- Diálogo reaproveitando a estrutura de `src/components/apply_gate_dialog/index.tsx`, com a **pergunta de escopo em primeiro lugar** (decisão de 27/08): `Apenas nesta amostra` (default) ou `Em todas as amostras do experimento`. A lista de arquivos com checkbox só aparece na segunda opção (`scope: "experiment"` + `target_file_data_ids`).
- Opções adicionais: `Incluir sub-gates` (`recursive`) e, no escopo de experimento, `Excluir também nesta amostra` (`include_source`).
- Amostras desabilitadas (BE-01) não aparecem na lista de alvos.
- Resumo antes de confirmar: `X gates serão apagados em Y amostras` (usar a contagem local da árvore; a resposta do backend traz o número real).
- Após sucesso: toast com o total apagado + invalidar `useExperimentFilesQuery`; se a fonte selecionada foi apagada, subir para o parent existente mais próximo (a lógica de fallback por caminho de nomes já existe em `goToAdjacentFile`/`findGateByPathNames` — reaproveitar).

## Estrutura

- `src/services/gateService.ts` — `deleteGatesBatch(payload)` tipado igual ao contrato do BE-03.
- `src/features/plot/hooks/useGateMutations.ts` — mutation + invalidação.
- `src/components/` — extrair o corpo comum (lista de arquivos com checkbox) do `apply_gate_dialog` para um componente reutilizado pelos dois diálogos, em vez de copiar.

## Critérios de aceite

- [ ] Default (`Apenas nesta amostra`) apaga só o gate selecionado; as cópias das outras amostras permanecem.
- [ ] Escolhendo `Em todas as amostras`, as cópias somem da árvore sem reload; a origem permanece se `include_source` estiver desmarcado.
- [ ] Com `Excluir também nesta amostra` → a origem também some e a seleção cai no parent.
- [ ] Desmarcar amostras restringe a exclusão corretamente.
- [ ] Erro do backend (403/404) mostra o `detail` e não deixa a árvore inconsistente.
- [ ] Diálogo usável em `xs`.
