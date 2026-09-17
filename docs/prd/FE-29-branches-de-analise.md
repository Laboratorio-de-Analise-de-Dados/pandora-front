# FE-29 — Branches de análise: seletor, fork e merge com conflitos

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/analysis-branches`
**Status:** não iniciado (backend pronto em `feat/analysis-checkpoints` —
BE-23, ADR-0020).

## Problema

Orientador e aluno analisam o mesmo experimento de formas diferentes e
hoje não há como isolar propostas — o resultado prático fora do sistema
é "analise dia 14.zip", "arquivo 2 - analise versao final". O backend
resolve isso com branches materializadas (`AnalysisBranch`): cada linha
tem suas árvores de gates, sua timeline e um merge auditável. Falta a UI.

## Contrato do backend (ADR-0020)

| Ação                 | Endpoint                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Listar branches      | `GET /analytics/experiment/<id>/branches/` → `{results: [{id, name, is_main, base_branch, created_by_name, gates_count, created_at}]}` |
| Criar (fork da base) | `POST .../branches/` `{name, base_branch_id?}` → 201 / 409 nome duplicado                                                              |
| Renomear / arquivar  | `PATCH` / `DELETE /analytics/branches/<id>/` (main: 400)                                                                               |
| Diff filha → base    | `GET /analytics/branches/<id>/diff/` → `{source, target, changes[], conflicts[]}`                                                      |
| Merge                | `POST /analytics/branches/<id>/merge/` `{resolutions: {key: "mine"                                                                     | "theirs" | "both"}, dry_run}`→ 200 / 409 com`conflicts` |
| Leitura por linha    | `?branch=<id>` em `GET /experiment/list/data/<id>/` (árvore de gates) e `GET .../history/`                                             |
| Reverter merge       | `POST /analytics/history/<merge_revision_id>/revert/` (reverte a cadeia)                                                               |

Tipos de conflito no diff: `f:<id>` editado nos dois lados (`fields`
traz `base`/`target`/`source` por campo), `dt:<id>` existe na branch mas
foi excluído na base, `ds:<id>` excluído na branch mas editado na base.
`"both"` só vale para `f:`.

## Escopo

### 1. Seletor de branch no workspace

Dropdown na `sourceNav` (ao lado do `SourceDropdown`) ou no topo do
workspace: branch ativa corrente + lista. Trocar de branch refaz as
queries de gates/histórico com `?branch=<id>` — a linha corrente vive no
estado da página (ou query param da URL, melhor para compartilhar link).

### 2. Gerenciar branches

No mesmo dropdown ou num menu: "Nova branch a partir de `<atual>`" (nome
obrigatório), renomear e arquivar (desabilitados na `main`).

### 3. Tela de diff/merge

Entrada: "Comparar/mergear na base" na branch não-main. Mostra:

- `changes`: gates a criar/atualizar/excluir na base (aplicáveis sem
  decisão — listar informativamente).
- `conflicts`: um card por conflito com o que mudou em cada lado e
  escolha `mine`/`theirs`/`both` (este último só em `f:`).
- `dry_run` no submit inicial para validar; 409 com conflitos abre a
  lista para resolver; re-submit com `resolutions` completo.
- Após merge: invalidar queries da base e mostrar resumo (`applied`).

### 4. Timeline por linha

O `HistoryPanel` nos dois níveis (amostra/experimento — FE-27) filtra
pela branch ativa quando uma está selecionada: `?branch=<id>` já
devolve a linha + ações experiment-wide.

## Arquivos a tocar

- `src/services/` — `branches.ts` (list/create/rename/archive/diff/merge).
- `src/features/` nova pasta `branches/` — hook `useBranches`, componentes
  `BranchSelector`, `MergeDialog`.
- `src/page/experiment/[id]/index.tsx` — estado da branch ativa e
  `?branch=` nas queries de árvore/histórico.
- `HistoryPanel` — prop `branch` opcional.

## Critérios de aceite

- [ ] Seletor lista branches com `main` primeiro; trocar recarrega gates
- [ ] Criar branch duplica a árvore visível (fork materializado)
- [ ] Editar gates numa branch não altera outra (verificar na main)
- [ ] Merge sem conflito aplica e aparece na timeline (`action="merge"`)
- [ ] Merge com conflito exige resolução por item; `both` cria o gate
      renomeado na base
- [ ] Reverter o merge pela timeline desfaz todas as mudanças
- [ ] `main` não pode ser arquivada/renomeada (UI desabilita)

## Fora de escopo

- Permissão por branch (qualquer editor mexe em qualquer linha —
  divisão orientador/aluno é por convenção de nome).
- Merge cross-experiment (derivação é FE-28/BE-19).
- Compensação por branch (backend v1 é experiment-wide).
- Lock de edição em tempo real.
