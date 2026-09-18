# FE-33 — Retomada silenciosa de processamento e erro com motivo

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/processing-resume`
**Status:** não iniciado.
**Depende de:** `pandora-backend` PRD BE-31 (advisory lock + `complete/`
idempotente + `error_info.error_message` serializado)

## Problema

Hoje o card do experimento reflete `experiment.status` cegamente:
`processing` vira chip "Processando" para sempre se o request de
`complete/` morrer no meio (restart, queda de rede), e `error` é um
chip vermelho sem dizer o porquê. O usuário não tem caminho de saída
— nem automático nem manual.

Observado em dev (2026-09): experimento ficou "Processando" eterno
após o backend reiniciar entre o upload e o `complete`.

## Escopo

### 1. Retomada silenciosa de órfão

- Card/lista que encontra experimento `processing` há tempo demais
  (limiar local, ex.: o tempo desde `updated_at` do experimento ou um
  timeout fixo de polling) **re-chama `complete/` silenciosamente** —
  com o BE-31, o backend decide: lock livre → reprocessa; lock ocupado
  → está vivo de verdade, responde 202 e o front volta a esperar.
- Retry apenas para `stopped`/órfão ou erro transitório, com bound
  (ex.: 3 tentativas espaçadas) — nunca loop infinito de re-chamadas.
- Nenhum botão/ação manual nova: a retomada é automática para quem
  está olhando a listagem; erro definitivo permanece `error` (abaixo).

### 2. Erro com motivo visível

- Chip de `error` no card ganha `Tooltip` (MUI) com
  `error_info.error_message` — hover/touch mostra a razão real
  ("FCS corrompido", "disco cheio"...) em vez de um vermelho mudo.
- Se o serializer do backend não expuser a mensagem na listagem,
  buscar o detalhe sob demanda (hover → GET do experimento) — decidir
  na implementação conforme o BE-31 entregar.

### 3. Estados do chip

- `processing` → spinner "Processando" (como hoje)
- `processing` órfão/`stopped` → o front já está tentando retomar; o
  chip pode continuar "Processando" — não precisa de estado visual novo
  a menos que o backend exponha `stopped` explicitamente
- `error` → chip vermelho + Tooltip com a mensagem

## Fora de escopo

- Botão manual "tentar de novo" — a retomada automática cobre o caso;
  se a operação pedir depois, é follow-up.
- Fila de jobs / mudança no modelo de processamento — isso é BE-31/BE-27.

## Arquivos a tocar

- `src/page/experiments/Card/index.tsx` — chip de `error` com Tooltip;
  gatilho de retomada silenciosa
- `src/services/experimentService.ts` — `completeExperiment` (se já
  não existir) + tipagem de `error_info` na resposta
- hook de polling (se a lista já não revalida `processing` via TanStack
  Query — usar `refetchInterval` enquanto houver `processing`)

## Critérios de aceite

- [ ] Experimento órfão volta a processar sozinho ao abrir a listagem
      (sem reload nem ação do usuário)
- [ ] `error` mostra a mensagem real no hover
- [ ] Nunca mais de 3 re-chamadas silenciosas por experimento
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm build` verdes
