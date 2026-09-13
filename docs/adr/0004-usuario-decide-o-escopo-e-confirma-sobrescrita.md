# ADR-0004 — A UI pergunta o escopo e confirma sobrescrita com dados reais

- **Status:** Aceito
- **Data:** 2026-09-08
- **Contexto do código:** diálogos de nome/cor, exclusão em lote e reshape de gate; `useGateMutations`

## Contexto

O backend aceita `scope` e `dry_run`
(`pandora-backend/docs/adr/0002`), mas quem decide é o usuário — e ele decide
dentro da UI, no momento da ação. Um aviso genérico do tipo "isso pode
sobrescrever dados" não ajuda: o usuário não sabe o que vai perder e clica em
"continuar" por hábito.

## Decisão

Toda ação que pode afetar mais de um gate abre um diálogo com a escolha
explícita — "apenas nesta amostra" (default) ou "em todas as amostras" — e, para
as ações que podem sobrescrever (aplicar sobre nome existente, propagar
geometria), o front chama primeiro `dry_run` e mostra **quais** amostras e
gates seriam alterados antes de confirmar.

O usuário nunca vê id: os rótulos usam o nome do gate e o caminho completo
(`Amostra › P1 › P1.1`), mesmo quando a identidade trocada com a API é `id`.

## Alternativas consideradas

### A) Preferência global ("sempre aplicar em todas")

Descartada enquanto não existir rollback: uma escolha feita uma vez passa a
sobrescrever silenciosamente para sempre.

### B) Confirmar com texto genérico, sem `dry_run`

Descartada: é o padrão que treina o usuário a ignorar confirmações.

### C) Aplicar e oferecer "desfazer" (undo otimista)

Descartada por ora: não há como desfazer no backend. Vira a opção preferida
quando o histórico/rollback existir
(`pandora-backend/docs/prd/BE-08-historico-rollback.md`).

## Consequências

- Mais um round-trip e um diálogo nas operações destrutivas.
- O diálogo precisa ser mobile-first (ADR-0002) porque cresce com a lista de
  impacto.
