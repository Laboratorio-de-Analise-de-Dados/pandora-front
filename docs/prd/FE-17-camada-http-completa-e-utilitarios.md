# FE-17 — Camada HTTP completa e utilitários compartilhados

**Repo:** pandora-front · **Tipo:** refactor · **Base:** `main`
**Branch sugerida:** `refactor/http-layer`
**Status:** implementado em `refactor/http-layer` — depende de merge.

## Problema

A regra "só `services/` fala HTTP" (ADR-0001/0008) tem furos: páginas e
componentes chamam `CytometryApi` diretamente — `page/home` busca
organizações ignorando o `organizationService` existente, `InviteModal`
posta convites ignorando o `inviteService`, e os fluxos de auth
(login/register/reset/invite/providers) não têm service algum. Em paralelo,
`err.response?.data?.detail || ...` é reescrito em ~10 lugares e
`position: "bottom-right"` em ~50 — convenções repetidas à mão. Há também
resíduos: `SelectionContext` sem consumidor e `console.log` esquecido em
`page/experiments`.

## Escopo

### 1. `services/authService.ts` (novo)

- Cobre os endpoints `accounts/*` hoje chamados direto: `login`,
  `register`, `requestPasswordReset`, `resetPassword`, `fetchInvite`,
  `fetchAuthProviders`, `fetchOrganizations` (ou reusar
  `organizationService` onde já existe — não duplicar).
- Tipos de resposta no próprio service ou `types/`.

### 2. Migrar consumidores

- `page/login`, `page/register`, `page/forgot-password`,
  `page/reset-password`, `page/invite`, `page/home`,
  `hooks/useAuthProviders.ts`, `components/InviteModal` passam a chamar
  services — zero `CytometryApi` fora de `src/services/` e `src/API/`.

### 3. `utils/apiError.ts` (novo)

- `extractErrorMessage(error): string` único — extrai `detail`, primeiro
  campo de serializer ou `message`. `useExperimentPageActions` e todas as
  páginas passam a usá-lo (o helper local do hook é removido).

### 4. Toast com default centralizado

- `position: "bottom-right"` sai das ~50 chamadas: configurar no
  `ToastContainer` global ou num wrapper `utils/toast.ts`.

### 5. Resíduos

- Remover `providers/SelectionContext` (sem consumidor) e o `console.log`
  em `page/experiments/index.tsx:35`.
- `NewExperiment`: remover `useExperimentsContext() as any` — o provider já
  é tipado.

## Arquivos a tocar

- `src/services/authService.ts` (novo), `src/services/organizationService.ts`
- `src/page/{login,register,forgot-password,reset-password,invite,home}/`
- `src/hooks/useAuthProviders.ts`, `src/components/InviteModal/`
- `src/utils/apiError.ts` (novo), `src/utils/toast.ts` (novo ou config no App)
- `src/providers/SelectionContext/` (removido), `src/providers/index.tsx`
- `src/page/experiments/index.tsx`, `src/components/page/experiments/NewExperiment/`

## Critérios de aceite

- [ ] `grep "CytometryApi" src` só retorna `src/API/` e `src/services/`.
- [ ] Nenhum `err.response?.data` parseado à mão — todos usam
      `extractErrorMessage`.
- [ ] Toasts sem `position` explícita mantêm bottom-right.
- [ ] `SelectionContext` removido; typecheck/testes/build verdes.

## Fora de escopo

- Reorganização de diretórios (FE-20) e decomposição de mega-arquivos
  (FE-18/FE-19) — esta entrega só fecha a camada HTTP e os utilitários.
