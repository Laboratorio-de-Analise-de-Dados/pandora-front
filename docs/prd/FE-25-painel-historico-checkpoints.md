# FE-25 — Painel de histórico e checkpoints de análise

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/analysis-history-panel`
**Status:** não iniciado — depende de BE-08 (histórico/revert, implementado em
`fix/gate-density-missing-channel`) e de
`pandora-backend/docs/prd/BE-20-checkpoints-de-analise.md` (não iniciado,
ADR-0017 Proposto).

## Problema

O backend já registra cada mutação da análise (`AnalysisRevision`, append-only)
e já sabe reverter uma revisão com dry-run — mas nada disso é visível. O item 4
do BE-08 (painel de histórico) ficou pendente. Com os checkpoints (BE-20), o
usuário ganha o ponto de salvamento nomeado estilo "commit": a timeline mostra
o que mudou, quem mudou, e permite voltar a um marco inteiro.

## Escopo

### 1. Painel de histórico

- Nova entrada na página do experimento (ícone de histórico no header ou aba
  no `ExperimentSidePanel`) abrindo painel/drawer com a timeline de
  `GET /analytics/experiment/<id>/history/` (cursor para paginar).
- Cada linha mostra `summary` (já vem legível: "renomeou P1 → CD4+ em 3
  amostras"), autor (`created_by_name`) e horário relativo.
- Expandir uma revisão abre o detalhe (`GET .../history/<rev>/`) com o
  before/after por alvo.
- Filtro por autor e por tipo de alvo (gate/amostra/subsample/experimento) —
  parâmetros já existem na API.

### 2. Checkpoints na timeline

- Botão "Salvar ponto" no topo do painel → dialog com campo de mensagem
  opcional → `POST .../checkpoints/`. Sem mensagem, o backend gera o nome por
  data/hora.
- Checkpoints aparecem como marcos na timeline (chip/divisor destacado) vindos
  de `GET .../checkpoints/`, intercalados por `created_at`/`revision_id`.
- Revisões anteriores ao último checkpoint podem vir colapsadas ("N alterações
  desde o último ponto") para a timeline não virar parede de texto.

### 3. Restaurar (revert unitário e por checkpoint)

- Revisão individual com `revertible=true` → botão "Reverter":
  `POST .../history/<rev>/revert/` com `dry_run` primeiro; dialog mostra
  `would_change`/`conflicts` antes de confirmar — mesmo padrão do
  `ApplyConflictDialog`.
- Checkpoint → "Restaurar este ponto": `POST .../checkpoints/<cp>/restore/`
  com `dry_run`; o dialog lista o plano composto e os conflitos.
- **Conflito detectado**: o restore normal falha (409) — o dialog passa a
  oferecer a opção explícita **"Sobrescrever alterações"** (`force=true`),
  com aviso nomeando o que será perdido. Sem força silenciosa.
- Após restore/revert: invalidar as queries de gates/files/subsamples do
  experimento (TanStack Query) — a árvore e os plots refletem o novo estado.

### 4. O que NÃO tem

- Sem prompt "deseja salvar?" ao sair da página: com autosave + log, nada se
  perde ao fechar. O checkpoint é o mecanismo de marco, não uma barreira de
  navegação (decisão do ADR-0017 backend).

## Arquivos a tocar

- `src/services/` — novo `historyService.ts` (history list/detail/revert +
  checkpoints create/list/restore), seguindo `gateService.ts`.
- `src/types/` — tipos `AnalysisRevision`, `AnalysisCheckpoint`, planos de
  revert/restore.
- `src/features/experiment/components/` — `HistoryPanel` (drawer), linha da
  timeline, `CheckpointDialog`, `RestoreDialog` (reuso do padrão de
  confirmação de `apply-gate-dialog`).
- `src/features/experiment/hooks/` — `useHistory` (TanStack Query com cursor),
  `useCheckpoints`, `useRestore` (mutation + invalidação).
- Página do experimento — entrada do painel no header/`ExperimentSidePanel`.

## Critérios de aceite

- [ ] Timeline lista revisões com summary, autor e horário; paginação por
      cursor.
- [ ] Detalhe de revisão mostra before/after legível.
- [ ] "Salvar ponto" cria checkpoint com mensagem opcional; marcos aparecem
      destacados na timeline.
- [ ] Revert unitário: dry-run → dialog → confirma; conflito bloqueia com
      explicação.
- [ ] Restore de checkpoint: dry-run → dialog com plano composto; em
      conflito, "Sobrescrever alterações" (`force`) aparece como escolha
      explícita, nunca automática.
- [ ] Após qualquer restore, árvore/plots/stats refletem o estado restaurado
      sem reload manual.
- [ ] Usuário sem permissão de edição vê a timeline mas não os botões de
      criar/reverter/restaurar.

## Fora de escopo

- Diff visual de geometria (antes/depois desenhado no plot) — o detalhe
  mostra os campos; visualização gráfica fica para evolução.
- Promover checkpoint a template/workspace (ponte do BE-19).
- Presença/edição colaborativa em tempo real.
- `beforeunload` — decisão registrada: não existe estado não-salvo.
