# FE-23 — Editar gate (nome/cor/escopo) a partir da árvore

**Repo:** pandora-front · **Item do doc:** teste 14/09/2026, item 1 · **Tipo:** fix (UX) · **Base:** `main`
**Branch sugerida:** `fix/gate-edit-from-tree` · **Depende de:** [ADR-0013](../adr/0013-replicacao-de-nome-cor-opt-in.md)
**Status:** implementado em `fix/density-missing-channel`.

## Problema

A edição completa de gate (nome + cor + escopo de replicação) só existe no menu
de contexto do gate **no gráfico**. Na árvore, o menu do gate oferece só
"Renomear" — um diálogo simples que muda só o nome, sempre local
(`onRenameGate` → PATCH sem `scope`). No teste de 14/09 o usuário editou e a
mudança ficou local; a opção de replicar existia mas não foi percebida.

Decisão (ADR-0013): o default continua local — quem edita, edita aquela
amostra; replicar é opt-in. O que muda é a apresentação: editar acessível pela
árvore e o escopo como controle explícito, não um radio que passa batido.

## Escopo

1. **"Editar" na árvore:** o item do menu do gate (⋮ e clique direito em
   `parent-tree/index.tsx`) passa a abrir o `GateEditDialog` completo — nome,
   cor e escopo — o mesmo do plot. O "Renomear" simples é absorvido (uma ação
   só, como no FE-03); remover o `renameDialog` legado de
   `useTreeInteractions.ts`.
2. **Escopo opt-in no diálogo:** substituir o `RadioGroup` sempre visível por
   um checkbox "Replicar nome e cor para outras amostras". Marcado → habilita
   um seletor com `Neste subsample (<nome>)` (pré-selecionado quando a amostra
   pertence a um) e `Em todas as amostras do experimento`. Desmarcado →
   `scope="file"` (default, comportamento atual).
3. **Controle só quando faz sentido:** o checkbox aparece apenas se
   `getCopyFamilyIds(experimentFiles, gate.id).length > 1` (helper já usado por
   `familySizeOf` no reshape). Gate sem cópias → diálogo sem a seção.
4. Mostrar a contagem no seletor ("Em todas as amostras (N)"), reaproveitando o
   padrão do `ReshapeScopeDialog`.
5. Manter: erro 400/409 de colisão exibido no diálogo sem fechar; toasts de
   `propagated_gate_ids`/`conflicts` de `saveGateNameColor`.

## Estrutura

- `src/features/plot/components/scatter-plot/components/GateEditDialog.tsx` →
  mover para `src/features/gate/components/` (passa a servir plot e árvore —
  ADR-0011) e trocar o RadioGroup pelo checkbox + seletor.
- `src/features/experiment/components/parent-tree/index.tsx` — menus do gate
  chamam o diálogo unificado; sai o `renameDialog` simples.
- `src/features/experiment/hooks/useTreeInteractions.ts` — trocar o fluxo
  `openRename`/`renameDialog` pela abertura do diálogo completo.
- `src/features/plot/hooks/useGateMutations.ts` — `saveGateNameColor` já cobre
  scope/conflitos; extrair para uso compartilhado se a árvore não puder
  importar do plot (ver ADR-0001: hook ok, componente não chama service).
- `src/features/gate/utils/gateTreeHelpers.ts` — `getCopyFamilyIds` (já existe,
  testado em `gateCopyFamily.test.ts`).

## Critérios de aceite

- [ ] Menu do gate na árvore tem "Editar" abrindo nome + cor + escopo.
- [ ] Salvar sem marcar o checkbox → só a amostra atual muda (default local).
- [ ] Checkbox marcado → seletor habilita; subsample pré-selecionado quando a
      amostra pertence a um.
- [ ] Salvar com replicação → nome/cor iguais nas cópias, toast com contagem.
- [ ] Gate sem família → diálogo sem a seção de replicação.
- [ ] Colisão de nome → mensagem no diálogo, formulário aberto.
- [ ] O diálogo não existe mais duplicado: plot e árvore usam o mesmo
      componente.

## Fora de escopo

- Mudar o default de escopo para propagar — decidido contra (ADR-0013).
- Replicação entre experimentos — `copied_from` não cruza experimento.
- Edição de geometria pela árvore (reshape continua no plot).
