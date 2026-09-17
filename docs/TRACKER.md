# Tracker de trabalho em andamento (multi-sessão)

Vários agentes/sessões podem trabalhar neste repo em paralelo. **Antes de
começar uma feature, leia este arquivo**: se a área já tem dono, escolha
outra que não conflite (conflito = mesmos arquivos, componentes ou
serviços) ou alinhe com o responsável.

- Ao **assumir** uma feature: adicione/atualize sua linha e commite junto.
- Ao **terminar**: marque ✅ (ou remova a linha).
- Uma linha por frente de trabalho; "área" = arquivos/contrato afetado.

## Em andamento

| Feature | Área afetada | Branch | Sessão | Desde |
| ------- | ------------ | ------ | ------ | ----- |

## Concluído nesta branch

| Feature                                    | Observação                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-25 painel de histórico/checkpoints      | `src/features/history/` — consome BE-20                                                                                                                                          |
| BE-21 client (thumbnail, papel, progresso) | `ExperimentPreview`, `RoleChip`, `LinearProgress` nos cards                                                                                                                      |
| FE-27 indicadores de análise               | `src/features/compensation/` + cluster na sourceNav, histórico por amostra (`?file=`), drawer de histórico no card, badge "Compensado", marcação de controles                    |
| FE-31 contas conectadas                    | Perfil "Contas conectadas" (link/unlink real), interstitial `link_notice` no auth-callback, dialog de merge (`merge_notice` → `POST /accounts/merge/confirm/`) — PRs #72/#73/#74 |

## Livres para pegar

| Feature                     | Observação                                                |
| --------------------------- | --------------------------------------------------------- |
| "Buscar amostras" na árvore | Follow-up registrado no FE-26                             |
| FE-28 derivar análise       | Backend pronto — `POST /experiment/<id>/derive-analysis/` |
| FE-29 branches de análise   | Backend pronto — `?branch=` + `/analytics/branches/*`     |
