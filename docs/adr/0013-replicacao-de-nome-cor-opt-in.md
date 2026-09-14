# ADR-0013 — Replicar nome/cor de gate é opt-in; a edição acontece onde o gate está

- **Status:** Proposto
- **Data:** 2026-09-14
- **Contexto do código:** `GateEditDialog.tsx`, menus do gate em
  `parent-tree/index.tsx` (`Renomear` simples) vs. `GateContextMenu` do plot
  (edição unificada); relações: `pandora-backend/docs/adr/0002`, ADR-0004
  deste repo

## Contexto

No teste de 14/09/2026 o usuário renomeou um gate replicado e a mudança ficou
só na amostra editada. Em vez de tratar como falha de default, a decisão de
produto foi a oposta: **quem edita um gate está editando aquela amostra** —
quem quer o grupo reaplica explicitamente. Mudar nome/cor localmente é um caso
legítimo (ajuste de apresentação por amostra) e não deve exigir desmarcar nada.

O problema observado então não é o default — é que (a) a edição completa
(nome + cor + escopo) só existe no menu de contexto do gate **no gráfico**, e
(b) na árvore só há um "Renomear" simples, sempre local, sem cor e sem escopo.

## Decisão

1. Default de edição segue `scope="file"` — reafirma ADR-0002 do backend e
   ADR-0004; nada muda para quem só salva.
2. A edição unificada (nome + cor + escopo) passa a existir **também pela
   árvore**: a ação do menu do gate abre o mesmo `GateEditDialog` do plot.
   Uma ação só — "Renomear" e "Cor" separados voltariam a duplicar entradas
   (o que o FE-03 removeu).
3. O escopo vira um controle **opt-in**: desmarcado = só esta amostra; ao
   marcar "Replicar para outras amostras", um seletor habilita com
   `Neste subsample` (pré-selecionado quando a amostra tem subsample) e
   `Em todas as amostras do experimento`. O controle só aparece quando o gate
   tem família de cópias (`getCopyFamilyIds` > 1) — sem cópias não há para
   onde propagar e a pergunta é ruído.

## Alternativas consideradas

### A) Pré-selecionar "todas as amostras" quando o gate tem cópias

Descartada em 14/09: quem salva sem ler propagaria sem querer — o erro na
direção contrária do que o teste mostrou. O default local é o comportamento
esperado por quem ajusta uma amostra específica.

### B) Propagar nome/cor sempre, sem perguntar

Descartada: elimina o ajuste local legítimo e contradiz ADR-0002/0004.

### C) Manter o radio de escopo sempre visível

Descartada: o radio com default `file` foi o que passou despercebido no teste.
O checkbox + seletor comunica melhor que replicar é uma ação extra, opt-in.

## Consequências

- Editar pela árvore dá acesso a cor e escopo — o usuário não precisa achar o
  gate no gráfico para a operação completa.
- O `GateEditDialog` sai de `features/plot` para casa compartilhada
  (`features/gate`), pois passa a servir dois domínios (ADR-0011).
- O "Renomear" simples da árvore (só nome, sempre local) é absorvido pelo
  diálogo unificado — revisar `onRenameGate`/`renameDialog` em
  `useTreeInteractions.ts`.
- Nada muda na API: `scope` omitido continua `file`.
