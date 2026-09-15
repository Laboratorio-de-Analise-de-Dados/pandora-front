# FE-25 — Painel de histórico e checkpoints de análise

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/analysis-history-panel`
**Status:** implementado em `fix/density-missing-channel` (aguardando
revisão) — sobre BE-08 + BE-20 (ambos entregues no backend). UX detalhada
definida (seção "UX — posicionamento e interação"), alinhada ao tema
dark-first de FE-26.

## Problema

O backend já registra cada mutação da análise (`AnalysisRevision`, append-only)
e já sabe reverter uma revisão com dry-run — mas nada disso é visível. O item 4
do BE-08 (painel de histórico) ficou pendente. Com os checkpoints (BE-20), o
usuário ganha o ponto de salvamento nomeado estilo "commit": a timeline mostra
o que mudou, quem mudou, e permite voltar a um marco inteiro.

## UX — posicionamento e interação

Ideia central: a timeline é um **painel de auditoria / controle de versão**
(estilo Git/Figma) que fica guardado e só entra em foco quando necessário —
não compete com o plot na tela.

### Desktop — drawer lateral direito

- **Entrada**: ícone de histórico (`History`/`GitBranch`) no header do
  workspace, ao lado das ações do experimento, com tag do checkpoint ativo
  (ex.: "Checkpoint: Pré-processamento").
- **Abertura**: gaveta deslizante no canto direito — sobrepõe ou expande
  sobre o painel de estatísticas (`CollapsiblePanel` direito já é o padrão).
- **Estrutura do painel**:

```
┌────────────────────────────────────────────────────────┐
│ Histórico e Checkpoints                          [ X ] │
├────────────────────────────────────────────────────────┤
│ [ 📌 Criar Checkpoint Agora ]                          │
├────────────────────────────────────────────────────────┤
│  ▼ Sessão de Hoje (15/Set — 14:20)                     │
│    ├─ 14:32 • Gate "CD3+" renomeado                    │
│    │     por Dra. Beatriz Ramos                        │
│    │     [ 🔄 Reverter esta ação ]                     │
│    ├─ 📌 CHECKPOINT: Antes do Re-gating (14:25)        │
│    │     por Você • 3 alterações                       │
│    │     [ 👁️ Visualizar ]  [ ⏪ Restaurar ]           │
│    └─ 14:20 • Propagação de 4 gates em Subsample_A     │
├────────────────────────────────────────────────────────┤
│  ▶ Sessão de Ontem (14/Set — 18:10) — 8 revisões      │
└────────────────────────────────────────────────────────┘
```

- **"Criar Checkpoint"** abre popover pedindo o nome do ponto (ex.: "Antes
  de aplicar K-Means").
- **Modo Preview** (`👁️ Visualizar`): ao focar um checkpoint antigo, o plot
  central entra em **modo de visualização histórica** — read-only, com barra
  de aviso no topo ("Você está visualizando a revisão #42 de 14/Set —
  apenas leitura") e fundo levemente diferenciado. Ver decisão aberta:
  depende de o backend servir o estado/geometry daquela revisão.
- **"Restaurar"** dispara o fluxo unificado de dry-run (abaixo).

### Mobile — aba na bottom nav + bottom sheet

- **Entrada**: item "Timeline" na **bottom navigation** do FE-26 — a timeline
  é um destino de primeiro nível no mobile.
- **Abertura**: bottom sheet full-screen com drag handle:

```
┌────────────────────────────────────────────────────────┐
│ ─── (drag handle)              Histórico         [ X ] │
├────────────────────────────────────────────────────────┤
│ 📌 Ponto de Controle Ativo:                            │
│    "Análise Inicial Controle" (15/Set - 10:00)         │
│ [ 📌 Salvar Ponto Atual ]                              │
├────────────────────────────────────────────────────────┤
│ 🟢 HOJE                                                │
│ ├─ 14:32 • Gate CD3+ editado (Dra. Beatriz)            │
│ ├─ 📌 CHECKPOINT: Pré-processamento                    │
│ │    [ Restabelecer este ponto ]                       │
│ └─ 14:20 • Gate Polígono criado                        │
│ ⚪ ONTEM                                               │
│ └─ 18:05 • Upload do arquivo FCS finalizado            │
└────────────────────────────────────────────────────────┘
```

- Confirmação de restore também em sheet full-screen, com o dry-run listado
  e o botão de confirmação explícito (verde ou alerta quando `force`).

### Fluxo unificado de restore (desktop + mobile)

Duas etapas, idênticas nos dois formatos:

1. **Simulação (dry-run)**: `POST .../restore/` com `dry_run` — a UI lista o
   que mudaria ("3 gates criados por Beatriz Ramos serão removidos, ..."),
   reusando o padrão dos dialogs de propagação (FE-26).
2. **Resolução de conflitos**: se a árvore divergiu depois do ponto, o
   restore simples bloqueia (409) e a UI exige confirmação explícita —
   checkbox "Estou ciente de que as alterações posteriores serão
   sobrescritas" + botão em estado destrutivo consciente (`force=true`).
   Nunca força silencioso.

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

### 2. Timeline em sessões + checkpoints fixados

- A timeline consome `GET .../history/?grouped=1`: revisões chegam agrupadas
  em **sessões** ("hoje 14:20–14:45 · 12 alterações") — são os
  auto-checkpoints temporais, derivados no backend, sem custo de escrita.
- Cada sessão aparece colapsável; sua borda é um ponto restaurável.
- **Pin**: ação na borda de uma sessão (ou numa revisão) →
  `POST .../checkpoints/` com `revision_id` e mensagem opcional → o ponto
  vira checkpoint permanente e passa a renderizar destacado na timeline.
- Botão "Salvar ponto" no topo = o mesmo endpoint sem `revision_id` (marca
  o estado atual).
- Checkpoints fixados vêm de `GET .../checkpoints/` e intercalam na timeline
  por `created_at`/`revision_id`.

### 3. Restaurar (revert unitário e por checkpoint)

- Revisão individual com `revertible=true` → botão "Reverter":
  `POST .../history/<rev>/revert/` com `dry_run` primeiro; dialog mostra
  `would_change`/`conflicts` antes de confirmar — mesmo padrão do
  `ApplyConflictDialog`.
- Qualquer ponto (borda de sessão, checkpoint, revisão avulsa) → "Restaurar
  até aqui": `POST .../history/<rev>/restore/` (ou `.../checkpoints/<cp>/restore/`
  para marcos) com `dry_run`; o dialog lista o plano composto e os conflitos.
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
- Página do experimento — entrada do painel no header/`ExperimentSidePanel`
  (desktop) e item "Timeline" na bottom nav do FE-26 (mobile).
- `src/components/Layout/` (ou onde a bottom nav do FE-26 morar) — slot do
  destino Timeline no mobile.

## Decisões abertas

- **Modo Preview (👁️)**: implementado na primeira versão como árvore
  read-only por amostra — o backend entrega `GET /analytics/history/<rev>/state/`
  (BE-20) com a árvore de gates reconstruída naquela revisão, e o painel a
  renderiza (nomes, cores, hierarquia) em dialog. O preview **gráfico**
  (geometria desenhada no plot) fica para evolução — ver Fora de escopo.
- **"Ponto de Controle Ativo" no mobile**: o conceito de "checkpoint ativo"
  não existe na API (checkpoints são marcos, não estado). Implementado como
  bloco "Pontos salvos" listando todos os checkpoints ativos com ações —
  resolve a dúvida sem inventar estado no backend.

## Critérios de aceite

- [ ] Timeline lista revisões agrupadas em sessões com summary, autor e
      horário; paginação por cursor.
- [ ] Detalhe de revisão mostra before/after legível.
- [ ] Pin numa sessão/revisão fixa checkpoint com mensagem opcional; "Salvar
      ponto" marca o estado atual; marcos aparecem destacados na timeline.
- [ ] Revert unitário: dry-run → dialog → confirma; conflito bloqueia com
      explicação.
- [ ] Restore de checkpoint: dry-run → dialog com plano composto; em
      conflito, "Sobrescrever alterações" (`force`) aparece como escolha
      explícita, nunca automática.
- [ ] Após qualquer restore, árvore/plots/stats refletem o estado restaurado
      sem reload manual.
- [ ] Usuário sem permissão de edição vê a timeline mas não os botões de
      criar/reverter/restaurar.
- [ ] Desktop: painel abre como drawer direito via ícone no header do
      workspace; mobile: abre como bottom sheet via aba Timeline na bottom
      nav — mesmo conteúdo e fluxo nos dois formatos.
- [ ] Visual segue os tokens do FE-26 (surfaces, verde de marca, badges de
      status do dry-run, botão destrutivo consciente em conflito).

## Fora de escopo

- Diff visual de geometria (antes/depois desenhado no plot) — o detalhe
  mostra os campos; visualização gráfica fica para evolução. O "Modo
  Preview" da UX depende dessa decisão (ver Decisões abertas).
- Promover checkpoint a template/workspace (ponte do BE-19).
- Presença/edição colaborativa em tempo real.
- `beforeunload` — decisão registrada: não existe estado não-salvo.
