# FE-32 — Dialogs de confirmação no padrão MUI (fim dos `window.*` nativos)

**Repo:** pandora-front · **Tipo:** refactor · **Base:** `main`
**Branch sugerida:** `feat/confirm-dialogs`
**Status:** não iniciado.
**ADR:** `docs/adr/0014` (convenção de confirmação e feedback)

## Problema

A auditoria de dialogs bloqueantes nativos encontrou 2 usos de
`window.confirm`, ambos em
`src/features/experiment/hooks/useExperimentMetaActions.ts`:

1. **Desativar experimento** (`handleDelete`, ~linha 71) — confirm nativo
   antes do `DELETE /experiment/<id>`.
2. **Upload duplicado** (`handleAddFile`, ~linha 102) — confirm nativo
   perguntando se envia mesmo com o arquivo já presente.

`window.confirm` é o diálogo do sistema operacional: não herda o tema
dark do Pandora, não é responsivo, não tem acessibilidade (foco,
teclado, leitor de tela) e não combina com a estética da aplicação —
que já usa `Dialog` do MUI em ~15 lugares (DeleteGateDialog,
RevertDialog, merge/unlink de contas etc.). Como ele é **síncrono**, a
migração exige um padrão assíncrono no hook.

## Escopo

### 1. Componente `ConfirmDialog` compartilhado

`src/components/ConfirmDialog/index.tsx` (componente de UI genérico,
fora de features):

- Props: `open`, `title`, `description` (ou `children`), `confirmLabel`
  (default "Confirmar"), `cancelLabel` (default "Cancelar"),
  `severity` (`"default" | "danger"` — danger pinta o botão de `error`),
  `loading`, `onConfirm`, `onCancel`.
- `Dialog` MUI com `fullWidth`, título, corpo e `DialogActions`
  (Cancelar / Confirmar) — mesma anatomia dos dialogs já existentes
  (merge/unlink no `ConnectedAccounts`, `RevertDialog`).

### 2. Hook `useConfirmDialog` (padrão assíncrono)

`src/components/ConfirmDialog/useConfirmDialog.ts` — ponte entre o
mundo síncrono do `window.confirm` e o declarativo do MUI:

- `confirm({ title, description, severity? }): Promise<boolean>` —
  abre o dialog e resolve `true`/`false` na escolha.
- Retorna também o elemento a renderizar (`<ConfirmDialogElement />`)
  ou o JSX via portal/contexto.
- Garante resolver em qualquer saída (Cancelar, X, Esc, backdrop) —
  Promise nunca fica pendurada.

### 3. Migração dos 2 usos

- `handleDelete` (desativar experimento): `severity="danger"`, título
  "Desativar experimento", corpo explicando que sai das listagens mas
  os dados são preservados e pode ser reativado.
- `handleAddFile` (arquivo duplicado): `severity="default"`, inclui o
  `file_name` retornado pelo check-hash no corpo.

Ambos passam a `await confirm(...)`, mantendo a mesma decisão de
fluxo (confirmou → segue; cancelou → aborta).

### 4. Regra de lint/culture

- Registrar no ADR-0014: `window.confirm`/`alert`/`prompt` são
  proibidos em código novo — confirmação é `ConfirmDialog`, feedback é
  Snackbar (ver "Fora de escopo").
- Sem eslint configurado hoje — a regra fica por convenção/review;
  se um dia entrar eslint, `no-alert` cobre.

## Arquivos a tocar

- `src/components/ConfirmDialog/index.tsx` (novo) — componente
- `src/components/ConfirmDialog/useConfirmDialog.ts` (novo) — hook
- `src/components/ConfirmDialog/useConfirmDialog.test.ts` (novo) —
  resolve true/false, nunca pendura
- `src/features/experiment/hooks/useExperimentMetaActions.ts` — troca
  os 2 `window.confirm` pelo hook

## Critérios de aceite

- [ ] Zero `window.confirm`/`alert`/`prompt` em `src/`
- [ ] ConfirmDialog segue o tema dark e é legível em `xs`
- [ ] Cancelar por qualquer via (botão, Esc, backdrop) resolve `false`
- [ ] Desativar experimento e upload duplicado funcionam com o dialog
      novo
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm build` verdes

## Fora de escopo

- **Unificação de feedback não-bloqueante**: `react-toastify` (~15
  arquivos) convive com `Snackbar` MUI (perfil). São duas linguagens
  visuais distintas; a recomendação do ADR-0014 é convergir para um
  hook de snackbar único, mas a migração é PRD próprio quando doer.
- Dialogs com formulário (unlink com senha, merge de contas) — já são
  MUI e seguem específicos; podem adotar o `ConfirmDialog` como base
  se fizer sentido, sem obrigação.
