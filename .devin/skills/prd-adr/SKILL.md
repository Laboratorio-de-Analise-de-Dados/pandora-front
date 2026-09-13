---
name: prd-adr
description: Criar PRD (docs/prd/FE-XX) ou ADR (docs/adr/XXXX) seguindo as convenções do Pandora
argument-hint: "[prd|adr] <tema da entrega ou decisão>"
allowed-tools:
  - read
  - edit
  - grep
  - glob
---

Documentar uma entrega (PRD) ou uma decisão arquitetural (ADR) neste repo.

Regra de bolso: PRD registra **o que** a entrega faz; ADR registra **por que**
uma decisão foi tomada. Se a mudança ainda não tem decisão fechada, o ADR vem
antes do PRD.

## Passo 0 — decidir o tipo

- **PRD** (`docs/prd/FE-XX-*.md`): escopo, comportamento esperado, arquivos a
  tocar, critérios de aceite. Um PRD por MR.
- **ADR** (`docs/adr/XXXX-*.md`): decisão, alternativas descartadas,
  consequências. Uma decisão por ADR.
- Decisões de **produto/domínio** (o que o sistema garante: soft delete,
  identidade da amostra, histórico) NÃO vão aqui — ficam em
  `pandora-backend/docs/adr/` e são referenciadas por nome, nunca copiadas.

## PRD — procedimento

1. Descobrir o próximo número: `glob docs/prd/FE-*.md`, pegar o maior + 1.
2. Criar `docs/prd/FE-XX-<slug-kebab>.md` em PT-BR, com o formato:

```markdown
# FE-XX — Título descritivo

**Repo:** pandora-front · **Tipo:** feature|fix|refactor · **Base:** `main`
**Branch sugerida:** `feat/<slug>`
**Status:** não iniciado | em andamento | entregue.

## Problema

O problema concreto, com o comportamento observado hoje.

## Escopo

### 1. <parte>

- comportamento esperado, regras de negócio, edge cases

## Arquivos a tocar

- caminhos reais + o que muda em cada um

## Critérios de aceite

- [ ] checklist verificável

## Fora de escopo

- o que fica explicitamente de fora
```

3. Consultar `docs/prd/FE-11-subsamples.md` como referência de tom e nível de
   detalhe.
4. Adicionar linha na tabela de `docs/prd/README.md`.

## ADR — procedimento

1. Descobrir o próximo número: `glob docs/adr/*.md`, pegar o maior + 1
   (formato `000X`, 4 dígitos).
2. Copiar a estrutura de `docs/adr/TEMPLATE.md` para
   `docs/adr/XXXX-<slug-kebab>.md`: Status, Data (AAAA-MM-DD), Contexto do
   código, Contexto (problema observado, não a solução), Decisão,
   Alternativas consideradas (A/B/C, cada uma com o motivo do descarte),
   Consequências (incluindo o que vira dívida).
3. **Nunca editar ADR aceito.** Se a decisão muda: ADR novo com
   `Substitui ADR-XXXX` e o antigo passa a `Substituído por ADR-YYYY` —
   atualizar os dois.
4. Adicionar linha na tabela "Índice de ADRs" de `docs/README.md`.

## Convenções de escrita

- PT-BR, direto, sem enfeite. Problema antes de solução; comportamento
  observado, não intenção.
- Referenciar arquivos/ADRs pelo caminho real (`src/features/plot/utils/`),
  nunca descrever de memória — conferir com `grep`/`glob` antes.
- Status do ADR novo: `Aceito` se a decisão já vigora no código, `Proposto`
  se ainda está em discussão.
