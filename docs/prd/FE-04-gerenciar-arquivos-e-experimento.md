# FE-04 — Desativar/reativar arquivo do experimento e editar o experimento

**Repo:** pandora-front · **Itens do doc:** 6, 13 · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/manage-experiment-and-files` · **Depende de:** BE-01 (soft delete), BE-02
**Status:** Entregue no PR #42.

## Escopo

### Item 6 — Desativar arquivo (soft delete)

O backend **não apaga** o arquivo: desativa (`active=False`), preservando dados e gates. A UI precisa refletir isso, sem prometer exclusão.

- Ação por arquivo na lista de amostras (`ExperimentSidePanel` / `SourceDropdown` / `parent_tree`): `Desabilitar amostra`.
- Diálogo de confirmação nomeando o arquivo, deixando claro que **os gates são preservados** e que a amostra pode ser reativada depois. Não usar a palavra "excluir".
- Filtro `Mostrar desabilitados` na lista de amostras → chama `GET /experiment/list/data/<id>/?include_inactive=true`. Arquivos inativos aparecem visualmente distintos (esmaecidos + chip `Desabilitada`) e com ação `Reativar`.
- Arquivo inativo não é selecionável como fonte do plot (ou, se selecionado, mostra aviso em vez de tentar buscar densidade — o backend responde erro).
- Após 200: invalidar `useExperimentFilesQuery`; se o arquivo desativado era a fonte selecionada, mover a seleção para outra amostra ativa (ou limpar quando não houver).
- Reativar → o arquivo volta à lista default com os gates intactos, sem reload.

### Item 13 — Editar experimento

- Ação "Editar" no card (`src/components/page/experiments/Card/index.tsx`) e/ou no header da página do experimento.
- Modal com `title`, `type` e `values`, reaproveitando o formulário do `NewExperiment` (extrair os campos para um componente compartilhado em `src/components/` em vez de duplicar).
- Após 200: invalidar `useExperimentQuery` e a listagem de experimentos.
- Exibir o `detail` do backend em erro de título duplicado.

## Estrutura

- `src/services/experimentService.ts` — `disableFileData(fileDataId)` / `enableFileData(fileDataId)` (`POST /experiment/file/<id>/disable|enable`), `fetchExperimentFiles(id, { includeInactive })` e `updateExperiment(id, payload)` (`PATCH /experiment/<id>/`).
- `src/types/ExperimentTypes.ts` — `ExperimentFiles` ganha `active: boolean`.
- `src/features/experiment/hooks/useExperimentPageActions.ts` (ou hook novo) — mutations + invalidação + toasts.
- Componentes só disparam as ações.

## Critérios de aceite

- [ ] Desabilitar um arquivo → confirmação, o arquivo sai da lista default sem reload, e a seleção se ajusta.
- [ ] Cancelar a confirmação não altera nada.
- [ ] Com `Mostrar desabilitados` ligado, o arquivo aparece esmaecido com chip e ação `Reativar`.
- [ ] Reativar devolve o arquivo à lista default com a árvore de gates intacta.
- [ ] Nenhum texto da UI promete exclusão definitiva.
- [ ] Editar título/tipo/values → valores atualizados no card e na página do experimento sem reload.
- [ ] Título duplicado → mensagem do backend visível no modal.
- [ ] Usuário sem permissão (403) → mensagem clara, sem estado quebrado na tela.
- [ ] Ações escondidas/desabilitadas para quem não pode editar.
