# ADR-0006 — Usuário cacheado com TTL e refresh de token no interceptor

- **Status:** Aceito
- **Data:** 2026-08-12 (registrado em 2026-09-13)
- **Contexto do código:** `AuthContext`, interceptor do axios, `ProtectedRoute`

## Contexto

O access token JWT é curto (15 min) e o refresh tem rotação. Sem tratamento
central, cada tela precisaria lidar com 401 e o usuário cairia no login no meio
de uma análise. Buscar `/me` em cada render, por outro lado, enche a rede de
requisições idênticas.

## Decisão

- O interceptor do axios é o único lugar que renova o access token com o
  `refresh_token`; em falha, redireciona para `/login`.
- O `AuthContext` cacheia o usuário no `localStorage` com TTL de 5 minutos e faz
  refresh em background, para a UI abrir com dado imediato sem servir dado velho
  indefinidamente.
- Rotas privadas usam `ProtectedRoute`; o header só mostra `Home`,
  `Experiments` e `Groups` autenticado.

## Alternativas consideradas

### A) Buscar `/me` em cada montagem de página

Descartada: flicker de layout e requisições redundantes a cada navegação.

### B) Cachear o usuário sem TTL, invalidando só no logout

Descartada: mudança de role ou entrada em grupo novo demorava a aparecer — foi
parte do sintoma "aceitei o convite e não vejo o grupo".

### C) Tratar 401 em cada chamada

Descartada: repete a lógica de refresh em todo serviço e é impossível garantir
que a próxima chamada nova lembre de fazê-lo.

## Consequências

- O dado do usuário pode estar até 5 minutos velho; ações que mudam vínculo
  (aceitar convite, mudar role) precisam chamar `refreshUser` explicitamente.
- Nenhum serviço deve tratar 401 por conta própria.
