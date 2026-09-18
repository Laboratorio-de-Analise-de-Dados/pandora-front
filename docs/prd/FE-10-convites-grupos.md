# FE-10 — Convites para grupos (verificação)

**Repo:** pandora-front · **Item do doc:** 1 · **Tipo:** investigação · **Base:** `main`
**Branch sugerida:** `fix/invites-flow` (só se houver bug a corrigir)
**Status:** Roteiro de verificação manual, não executado (precisa de duas contas e ambiente rodando). O bug concreto relatado (convite aceito e membro não aparecia no grupo) era backend e foi corrigido no PR #75.

**Achado 2026-09 (sem rodar o roteiro):** o passo 1 falhou na prática —
o e-mail de convite saía mas não levava a URL do app ("acesse o Pandora"
sem link), e convidados precisavam pedir o endereço. Corrigido no backend:
PR Laboratorio-de-Analise-de-Dados/pandora-backend#107 (corpo leva
`FRONTEND_URL`, sem token — mantida a decisão de segurança).

## Situação

O fluxo está implementado dos dois lados:

Backend (`accounts/urls.py`): `organizations/<id>/invites/`, `invites/pending/`, `invites/<token>/`, `invites/accept/<token>/`, `invites/decline/<token>/`.
Front: `src/services/inviteService.ts`, `src/hooks/useInvites.ts`, `src/components/InviteModal/`, sino no `src/components/headers/`, páginas `page/invite`, `page/organizations`.

O item do doc diz apenas "verificar convites para grupos", sem descrever a falha. Antes de codar, precisa reproduzir.

## Roteiro de verificação (fazer antes de abrir MR)

1. Usuário A cria organização e convida o e-mail de B (que **não** tem conta) → checar que o e-mail sai e que nenhum link com token vai no corpo (decisão de segurança do projeto).
2. B se cadastra com o mesmo e-mail → convite aparece no sino do header, com badge de contagem.
3. B aceita → `refreshUser` atualiza o cache do `AuthContext`, o convite sai da lista e a organização aparece na home/`/experiments`.
4. B recusa → convite sai da lista e não reaparece após reload.
5. Convite para e-mail que **já** tem conta → aparece no sino sem precisar de novo cadastro.
6. Convite duplicado para o mesmo e-mail → erro tratado, sem 500.
7. Convite expirado/já usado → mensagem clara.
8. Sino em viewport `xs`.

## Escopo

Registrar o resultado do roteiro (no PRD ou como issues) e abrir MR **apenas** para os passos que falharem, um MR por falha se forem independentes.

## Critérios de aceite

- [ ] Roteiro executado e resultado documentado passo a passo.
- [ ] Cada falha encontrada tem issue ou MR próprio.
- [ ] Se tudo passar: item 1 marcado como "sem bug" com a evidência.
