# ADR-0014 — Confirmação e feedback só via componentes MUI

- **Status:** Aceito
- **Data:** 2026-09-17
- **Contexto do código:** `src/features/experiment/hooks/useExperimentMetaActions.ts` (2 `window.confirm` restantes), `src/components/ConfirmDialog/` (a criar, PRD FE-32), `react-toastify` em ~15 arquivos vs `Snackbar` MUI no perfil

## Contexto

Dialogs nativos do browser (`window.confirm`/`alert`/`prompt`) ignoram o
tema dark do Pandora, não são responsivos, têm acessibilidade pobre e
quebram a consistência visual — o app já usa `Dialog` MUI para
confirmações em ~15 lugares. Em paralelo, o feedback não-bloqueante está
dividido entre `react-toastify` (legado) e `Snackbar` MUI (perfil,
FE-31), duas linguagens visuais para o mesmo propósito.

## Decisão

1. **Confirmação bloqueante é sempre `Dialog` MUI** — via o componente
   compartilhado `ConfirmDialog` + hook `useConfirmDialog` (Promise de
   `boolean`, resolve em qualquer saída). `window.confirm`/`alert`/
   `prompt` são proibidos em código novo.
2. **Feedback não-bloqueante converge para `Snackbar` MUI** — a longo
   prazo o `react-toastify` sai; migração fica para PRD próprio, não
   bloqueia entregas que já usam toast.

## Alternativas consideradas

### A) Manter `window.confirm` nos fluxos antigos

Descartada: é exatamente a inconsistência observada — confirmações
críticas (desativar experimento) apresentadas no cromo do SO.

### B) Padronizar tudo em `react-toastify` para feedback

Descartada: o tema do app é MUI; o Snackbar herda tokens, posicionamento
e a11y de graça. Toastify exigiria estilização customizada para não
destoar — manutenção sem ganho.

### C) `ConfirmDialog` por feature em vez de compartilhado

Descartada: confirmação é genérica (título + corpo + dois botões);
duplicar em cada feature reabre a porta para divergências de padrão.

## Consequências

- Fluxos síncronos com `window.confirm` viram `await confirm(...)` —
  exige o padrão Promise do `useConfirmDialog` (FE-32).
- `react-toastify` passa a ser **dívida registrada**: código novo usa
  Snackbar; os ~15 usos antigos migram quando tocados ou num PRD
  dedicado.
- Sem eslint hoje: a proibição de `window.*` vive em review/convenção
  até existir `no-alert`.
