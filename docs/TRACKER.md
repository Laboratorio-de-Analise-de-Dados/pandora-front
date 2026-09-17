# Tracker de trabalho em andamento (multi-sessão)

Vários agentes/sessões podem trabalhar neste repo em paralelo. **Antes de
começar uma feature, leia este arquivo**: se a área já tem dono, escolha
outra que não conflite (conflito = mesmos arquivos, componentes ou
serviços) ou alinhe com o responsável.

- Ao **assumir** uma feature: adicione/atualize sua linha e commite junto.
- Ao **terminar**: marque ✅ (ou remova a linha).
- Uma linha por frente de trabalho; "área" = arquivos/contrato afetado.

## Em andamento

| Feature                 | Área afetada                                                                                        | Branch                    | Sessão | Desde   |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- | ------ | ------- |
| FE-31 contas conectadas | `src/page/profile`, `src/page/auth-callback`, `src/features/profile`, `src/services/authService.ts` | `feat/connected-accounts` | devin  | 2026-09 |

## Concluído nesta branch

| Feature                                    | Observação                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-25 painel de histórico/checkpoints      | `src/features/history/` — consome BE-20                                                                                                                       |
| BE-21 client (thumbnail, papel, progresso) | `ExperimentPreview`, `RoleChip`, `LinearProgress` nos cards                                                                                                   |
| FE-27 indicadores de análise               | `src/features/compensation/` + cluster na sourceNav, histórico por amostra (`?file=`), drawer de histórico no card, badge "Compensado", marcação de controles |

## Livres para pegar

| Feature                     | Observação                                                |
| --------------------------- | --------------------------------------------------------- |
| "Buscar amostras" na árvore | Follow-up registrado no FE-26                             |
| FE-28 derivar análise       | Backend pronto — `POST /experiment/<id>/derive-analysis/` |
| FE-29 branches de análise   | Backend pronto — `?branch=` + `/analytics/branches/*`     |
