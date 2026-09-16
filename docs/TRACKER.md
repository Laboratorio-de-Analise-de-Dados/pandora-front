# Tracker de trabalho em andamento (multi-sessão)

Vários agentes/sessões podem trabalhar neste repo em paralelo. **Antes de
começar uma feature, leia este arquivo**: se a área já tem dono, escolha
outra que não conflite (conflito = mesmos arquivos, componentes ou
serviços) ou alinhe com o responsável.

- Ao **assumir** uma feature: adicione/atualize sua linha e commite junto.
- Ao **terminar**: marque ✅ (ou remova a linha).
- Uma linha por frente de trabalho; "área" = arquivos/contrato afetado.

## Em andamento

| Feature                               | Área afetada                                                  | Branch                       | Sessão                      | Desde      |
| ------------------------------------- | ------------------------------------------------------------- | ---------------------------- | --------------------------- | ---------- |
| FE-26 tema dark-first + layout mockup | `src/theme/`, `src/page/experiment/[id]/`, components globais | `refactor/tema-pandora-dark` | sessão front (outro agente) | 2026-09-15 |

## Concluído nesta branch

| Feature                                    | Observação                                                  |
| ------------------------------------------ | ----------------------------------------------------------- |
| FE-25 painel de histórico/checkpoints      | `src/features/history/` — consome BE-20                     |
| BE-21 client (thumbnail, papel, progresso) | `ExperimentPreview`, `RoleChip`, `LinearProgress` nos cards |

## Livres para pegar

| Feature                          | Observação                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-27 indicadores de análise     | PRD pronto: `docs/prd/FE-27-indicadores-historico-compensacao.md` — ícones de compensação + histórico ao lado do nome do arquivo, `CompensationPanel`, marcação de controles. Backend completo em `feat/analysis-checkpoints` |
| `member: "Membro"` no `RoleChip` | Label faltando — exibe "MEMBER" cru hoje                                                                                                                                                                                      |
| "Buscar amostras" na árvore      | Follow-up registrado no FE-26                                                                                                                                                                                                 |
