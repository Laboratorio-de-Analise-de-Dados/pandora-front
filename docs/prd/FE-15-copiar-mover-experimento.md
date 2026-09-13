# FE-15 — Copiar/mover experimento entre contextos (pessoal ↔ organização)

**Repo:** pandora-front · **Tipo:** feature · **Base:** `refactor/node-26-upgrade`
**Status:** não iniciado — bloqueado no
[BE-11](../../../pandora-backend/docs/prd/BE-11-copiar-mover-experimento.md).

## Problema

O usuário não consegue levar um experimento do espaço pessoal para uma
organização (ou partir de um existente) sem re-upload. O backend vai oferecer
copiar (análise nova sobre o mesmo blob) e mover (mesmo experimento troca de
contexto) — falta a UI.

## Escopo

### 1. Ações no card/menu do experimento

- Menu ⋮ do experimento em `src/components/page/experiments/Card/` ganha:
  - **"Copiar para…"** → diálogo com select de destino: "Espaço pessoal" +
    organizações do usuário + campo de título (default `"<título> (cópia)"`).
  - **"Mover para…"** → mesmo select de destino; confirmação explica que o
    experimento troca de contexto (visibilidade/permissão mudam), sem cópia.
- Só quem pode editar vê as ações (`canEditExperiment` ou papel equivalente
  na listagem).

### 2. Diálogo de destino

- Um `ExperimentContextDialog` compartilhado: select de destino +
  campo título (só na cópia) + botão confirmar.
- Erros da API no campo: título duplicado no destino (400), sem permissão
  (403 → toast).
- Sucesso: toast + invalida a listagem (`["experiments"]` ou query real).

## Arquivos a tocar

- `src/components/page/experiments/Card/index.tsx` — itens de menu
- `src/components/page/experiments/Card/dialogs.tsx` (novo) — diálogo de
  destino
- `src/services/experimentService.ts` — `copyExperiment`,
  `moveExperiment` (PATCH `organization_id`)
- `src/features/experiment/hooks/` — mutations + invalidação

## Critérios de aceite

- [ ] "Copiar para…" cria cópia independente instantânea (sem upload) e ela
      aparece na listagem do contexto destino.
- [ ] "Mover para…" troca o contexto sem duplicar; some da listagem atual.
- [ ] Destino = pessoal ou org que o usuário pertence; sem permissão → 403
      tratado.
- [ ] Mobile-first (ADR-0002): diálogo legível no `xs`.

## Fora de escopo

- Copiar/mover em lote (vários experimentos de uma vez).
- Escolher subconjunto de amostras na cópia.
