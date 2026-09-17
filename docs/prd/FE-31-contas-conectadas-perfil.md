# FE-31 — Contas conectadas no perfil + aviso de vínculo no login SSO

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/connected-accounts`
**Status:** não iniciado.
**Backend:** `pandora-backend/docs/prd/BE-29` · **ADR cruzado:** `pandora-backend/docs/adr/0025`

## Problema

A mesma pessoa pode ter conta pessoal (`hotmail`) e institucional
(`aluno.fiocruz.br`) e hoje vira dois usuários isolados. O backend (BE-29)
passa a manter vínculos explícitos de IdP por usuário, mas o front não tem
nenhum lugar para gerenciá-los — e o login SSO com match de email passa a
depender de uma tela de confirmação que não existe.

## Escopo

### 1. Seção "Contas conectadas" no perfil

Em `src/page/profile/index.tsx`, nova seção listando os vínculos
(`GET /accounts/users/me/social-accounts/` via TanStack Query):

- Linha por provider: ícone + nome ("Microsoft", "Google"), email do IdP,
  badge "conectado".
- Botão "Conectar" para providers ausentes → `POST
/accounts/auth/<provider>/link/` → redirect pro IdP → retorna vinculado
  (invalida a query).
- Botão "Desconectar" por vínculo ativo → confirmação em `Dialog`.
- Estado vazio: texto explicando que é possível vincular logins sociais.

### 2. Regra do último acesso (unlink)

- Se o vínculo é o último método de acesso (sem senha + sem outro
  provider): o Dialog de confirmação expande para coletar **email
  principal + senha** (ou disparar "enviar link de redefinição") antes de
  habilitar o confirmar — a API devolve 400 explicativo se o front não
  cumprir.
- Após unlink: feedback via snackbar e refetch da lista.

### 3. Aviso de vínculo no login (interstitial)

`src/page/auth-callback/index.tsx` passa a tratar o novo estado:
callback chega com `link_notice=1&email=...&provider=...&token=...` (sem
`access`/`refresh`) → renderiza tela "Encontramos uma conta com o email
X. Continuar vincula este login <provider> a ela." com dois botões:

- **Continuar** → `POST /accounts/auth/<provider>/confirm-link/` com o
  token → recebe JWT → `storeToken` → `/`.
- **Voltar ao login** → descarta o token → `/login` (usuário entra com
  email+senha se não quiser vincular).

### 4. Estados e erros

- Loading no redirect OAuth e na confirmação.
- 409 (identidade já vinculada a outra conta) → mensagem clara; merge
  (BE-30) chega depois, por ora informa para contatar suporte/usar o
  outro login.
- Token de confirmação expirado → mensagem + botão para recomeçar o
  login.

## Arquivos a tocar

- `src/page/profile/index.tsx` — seção Contas conectadas
- `src/features/profile/` (novo) — `useSocialAccounts`, `useLinkProvider`,
  `useUnlinkProvider`, `components/ConnectedAccountsSection`
- `src/page/auth-callback/index.tsx` — branch `link_notice`
- `src/services/` (API client) — métodos novos
- `src/router/index.tsx` — se a confirmação virar rota própria

## Critérios de aceite

- [ ] Perfil lista vínculos e permite conectar/desconectar providers
- [ ] Último acesso exige email+senha/reset antes de desvincular
- [ ] Login SSO com email-match exibe o aviso e só emite JWT após
      confirmação
- [ ] Cancelar o aviso devolve ao login sem sessão
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm build` verdes
- [ ] Mobile-first: seção e dialog legíveis em `xs`

## Fora de escopo

- Fluxo de merge de contas (UI do BE-30)
- Histórico de eventos de auth exibido na UI (fase 2)
- Avatar/foto do provider
