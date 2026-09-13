# ADR-0003 — Convites pendentes no sininho do header

- **Status:** Aceito
- **Data:** 2026-08-20 (registrado em 2026-09-13)
- **Contexto do código:** header/notificações, `inviteService`, `useInvites`

## Contexto

O convite não vem por link no e-mail (decisão de segurança do backend:
`pandora-backend/docs/adr/0010`), então o front precisa ser o lugar onde o
convite aparece. A primeira versão listava convites em uma seção grande na home,
que empurrava os grupos do usuário para baixo e sumia depois do primeiro aceite.

## Decisão

Convites pendentes vivem em um ícone de sino no header, com badge de quantidade e
dropdown para aceitar/recusar. A home mostra apenas os laboratórios/grupos do
usuário. Aceitar chama `refreshUser` (o `AuthContext` cacheia o usuário por 5
min) e remove o convite da lista, para o grupo novo aparecer sem recarregar a
página.

## Alternativas consideradas

### A) Seção de convites na home

Descartada: ocupa o espaço nobre por um evento raro e ainda deixa o usuário sem
saber do convite quando ele está em outra rota.

### B) Página `/invites` dedicada

Descartada: exige que o usuário saiba que ela existe; sem link no e-mail, nada o
levaria até lá.

### C) Toast/snackbar no login

Descartada: é efêmero — se o usuário não clicar na hora, o convite desaparece.

## Consequências

- O convite é visível de qualquer rota autenticada.
- Aceitar precisa invalidar o cache do usuário; esquecer isso reproduz o sintoma
  de "aceitei e não apareceu no grupo".
