# Tracker de trabalho em andamento (multi-sessão)

> **Status de features NÃO vive aqui** — pipeline (backlog/fazendo/
> entregue/produção), prioridade e checklists de progresso estão no
> Trello, board **"Pandora — Implementações"**
> (https://trello.com/b/dXb21KpL). Cada card linka seu PRD/ADR na
> descrição. Este arquivo é só **coordenação entre sessões paralelas**
> (quem está tocando qual área de arquivos agora).

Vários agentes/sessões podem trabalhar neste repo em paralelo. **Antes de
começar uma feature, leia este arquivo**: se a área já tem dono, escolha
outra que não conflite (conflito = mesmos arquivos, componentes ou
serviços) ou alinhe com o responsável.

- Ao **assumir** uma feature: adicione/atualize sua linha e commite junto.
- Ao **terminar**: marque ✅ (ou remova a linha).
- Uma linha por frente de trabalho; "área" = arquivos/contrato afetado.

## Em andamento

| Feature                 | Área afetada                                                | Branch | Sessão | Desde |
| ----------------------- | ----------------------------------------------------------- | ------ | ------ | ----- |
| FE-41 MFI por população | ✅ concluído — mergeado (PRs #107/#108/#109), deploy v0.8.0 | —      | —      | —     |

## Concluído nesta branch

| Feature                                    | Observação                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-39/FE-40/FE-41 compensação              | Modal de cálculo direto + editor de matriz (derivação manual) + prévia ao vivo no workspace (PRs #104/#105 — main). Tabela de MFI por população + seletor de gates → PR #107     |
| Painel direito em seções expansíveis       | Estatísticas + Compensação + Histórico; drawer lateral no mobile; triggers consolidados (mergeado no PR #105)                                                                    |
| FE-38 buscar amostras na árvore            | Campo de busca no `ParentTree` (nome, tag, subsample; sem acento/case) + `utils/treeFilter*` — PR #99                                                                            |
| FE-25 painel de histórico/checkpoints      | `src/features/history/` — consome BE-20                                                                                                                                          |
| BE-21 client (thumbnail, papel, progresso) | `ExperimentPreview`, `RoleChip`, `LinearProgress` nos cards                                                                                                                      |
| FE-27 indicadores de análise               | `src/features/compensation/` + cluster na sourceNav, histórico por amostra (`?file=`), drawer de histórico no card, badge "Compensado", marcação de controles                    |
| FE-31 contas conectadas                    | Perfil "Contas conectadas" (link/unlink real), interstitial `link_notice` no auth-callback, dialog de merge (`merge_notice` → `POST /accounts/merge/confirm/`) — PRs #72/#73/#74 |
| FE-34 tags de amostra                      | `src/features/tags/` (chips compactos, picker com controle exclusivo, sugestões, lote por delta) + metadados — PR #97                                                            |
| FE-32 dialogs de confirmação               | `ConfirmDialogProvider` + `useConfirm()` (Promise<boolean>); migrados os 2 `window.confirm` de `useExperimentMetaActions` — ADR-0014                                             |
| #70 dialogs → AppDialog                    | 4 dialogs do parent-tree no shell `AppDialog` + prop `confirmAutoFocus`/`data-mui-focusable` p/ foco inicial — PR #103                                                           |

## Livres para pegar

| Feature                         | Observação                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Google SSO — ativação (fase 2)  | UI já pronta (botão via `providers.google`); falta só credencial no backend. Decisão 2026-09: ativar antes da virada para v1 em prod — ver PRD BE-29 no backend                                              |
| FE-29 branches — retomada       | **Pós-v1.** Código completo arquivado em `archive/fe-29-branches` (seletor, merge, vocabulário de domínio); backend `?branch=` segue na API. Antes de reabrir, repensar a UX de versionamento sem jargão git |
| FE-35 mapa de placa 96 poços    | FE-34 (UI de tags) já em produção (v0.7.0); falta o mapa de placa — acompanhado no card "FE-34/35" do Trello                                                                                                 |
| FE-36 análise de dados — fase 1 | Figuras persistidas (dep. BE-33 no backend): galeria + gráficos de stats/distribuições + grupos por figura + export PNG/SVG carimbado com revisão. ANOVA é fase 2. Ver PRD                                   |
| FE-37 templates de análise      | Herda-e-revisa por tipo de ensaio (CBA etc.): template guarda estrutura + papéis de canal; aplicar remapeia canais e revisa posições com controles. Depende de backend novo. Ver PRD                         |
