# FE-24 — Detalhes e edição do experimento no card da listagem

**Repo:** pandora-front · **Item do doc:** teste 14/09/2026, item 3 · **Tipo:** fix (UX) · **Base:** `main`
**Branch sugerida:** `fix/experiment-card-edit`
**Status:** não iniciado.

## Problema

A edição do experimento existe (BE-02 + FE-04), mas só é alcançável pelo botão
de lápis no header da página interna. Quem está na listagem não encontra — no
teste o usuário viu o "desativar" mas não achou onde editar título/tipo/values
("metadados do experimento").

## Escopo

1. **Mesmo símbolo das amostras:** ícone `MdInfoOutline` (o ⓘ de "Metadados do
   arquivo" em `parent-tree/FileTreeItem.tsx`) no card do experimento
   (`src/page/experiments/Card/index.tsx`), ao lado do ⋮ existente, com
   `title="Detalhes do experimento"`. `stopPropagation` para não navegar.
2. **Um diálogo só:** mostrar os dados do experimento (título, tipo,
   values/marcadores, criador, organização, status ativo/desativado) **e**
   permitir editar — reaproveitar/estender o `EditExperimentDialog`
   (`src/features/experiment/components/EditExperimentDialog.tsx`) com uma seção
   de informações read-only acima dos campos editáveis, em vez de criar um
   segundo modal.
3. Permissão: quem não pode editar (regra do BE-02) vê o diálogo em modo
   somente-leitura — campos desabilitados, sem botão Salvar. O ⋮ segue como
   está (Copiar/Mover).
4. Após salvar: invalidar a listagem (`refresh`/`listExperiments`) — mesmo
   fluxo das ações de copiar/mover/restaurar do card.

## Estrutura

- `src/page/experiments/Card/index.tsx` — `IconButton` ⓘ + estado do diálogo.
- `src/features/experiment/components/EditExperimentDialog.tsx` — seção
  read-only de metadados + modo somente-leitura.
- `src/features/experiment/hooks/useExperimentMetaActions.ts` — mutation de
  update já existe; o card passa a consumir (hook ou direto via service, como
  `restoreExperiment` já é chamado no card).

## Critérios de aceite

- [ ] Card mostra ⓘ; clicar não navega para o experimento.
- [ ] Diálogo exibe título, tipo, values, criador, organização e status.
- [ ] Usuário com permissão edita e salva → card/listagem atualizam sem reload.
- [ ] Sem permissão → diálogo abre somente-leitura.
- [ ] Título duplicado → `detail` do backend visível no diálogo.

## Fora de escopo

- Novos campos editáveis no backend — o PATCH atual (title/type/values) cobre
  o pedido; "descrição" do relato se mapeia a `values`/tipo.
