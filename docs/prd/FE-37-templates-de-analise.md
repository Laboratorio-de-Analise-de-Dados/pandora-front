# FE-37 — Templates de análise: herda e revisa por tipo de ensaio

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/analysis-templates`
**Status:** não iniciado.
**Dependência:** backend novo — persistência de template de análise
(árvore de gates desacoplada de `file_data`, com papéis de canal).
**Relacionado:** FE-28 (derivação por identidade de arquivo), BE-26 /
FE-34/35 (identificação de controles — insumo futuro do ajuste).

## Problema

O FE-28 entrega derivação **por identidade de arquivo**: a árvore de
gates só é copiada para amostras que casam por `content_guid` (ou
`file_name`). Isso cobre o caso estreito de re-upload e experimento
recomposto — mas não cobre o fluxo recorrente do laboratório:

> "Fiz uma análise de CBA semana passada. Chegou outra placa de CBA de
> outro dia, com outras amostras. Quero a mesma **estratégia** de
> análise — não os mesmos arquivos."

Ensaios padronizados (CBA, painéis de imunofenotipagem, kits
comerciais) repetem a **estrutura** da análise a cada corrida — mesma
sequência de gates, mesma hierarquia, mesma lógica de populações — mas
com **arquivos diferentes**, **marcadores possivelmente diferentes** e
**posições de gate deslocadas** pela aquisição do dia (calibração,
PMT, fluorescência). Hoje o usuário redesenha tudo ou abre mão da
consistência entre corridas.

## Decisão de produto

O template reutiliza a **estrutura** (hierarquia, nomes, tipos de gate,
lógica de decisão); o usuário **remapeia os canais** e **reajusta as
posições** com os controles. É o modelo "herda e revisa" — ponto de
partida consistente + revisão humana —, não cópia cega. Softwares de
referência (FlowJo, FCS Express) vendem o equivalente como
_workspace/template_: a análise herda, o citometrista valida.

## Escopo

### 1. Salvar template a partir de uma análise

- A partir de uma amostra analisada (ou do experimento), "Salvar como
  template": persiste a árvore de gates — nomes, hierarquia pai→filho,
  tipo de gate (retângulo, polígono, intervalo, quadrante), geometria
  **relativa** e os **papéis de canal** de cada eixo (ex.: "scatter",
  "marcador PE", "marcador APC") — não o canal físico fixo.
- Template é um objeto nomeado e versionável (ver Fora de escopo) —
  pertence ao usuário ou à organização.
- A lista de templates mostra painel declarado (papéis exigidos) e
  origem (experimento/amostra de onde nasceu).

### 2. Aplicar template a um experimento

- No card do experimento, "Aplicar template de análise" (ao lado de
  "Derivar análise de…").
- **Passo 1 — mapeamento de canais**: para cada papel declarado no
  template, o usuário indica qual canal do experimento alvo cumpre o
  papel. Pré-sugestão automática quando o nome do canal coincide
  (`PE-A` → papel PE). Mapeamento incompleto bloqueia o avanço.
- **Passo 2 — escopo**: quais amostras recebem a árvore (todas,
  seleção manual, ou por subsample). Amostra que já tem gates é
  pulada — mesma proteção do FE-28.
- **Passo 3 — dry-run + relatório**: preview do que será criado por
  amostra; no fim, relatório igual ao da derivação (casadas, puladas,
  criadas).

### 3. Herda e revisa — o ajuste com controles

- Gates criados por template nascem marcados como **"a revisar"**
  (estado visual na árvore — badge/chip — distinto de gate manual).
- A revisão é assistida: o fluxo sugere começar pelas **amostras de
  controle** para reposicionar os gates-base e só depois propagar o
  ajuste. No v0 o usuário indica manualmente qual(is) amostra(s) são
  controle na hora do ajuste; quando BE-26/FE-34 entregarem o label de
  controle, a sugestão passa a ser automática (sem nova tela — a mesma
  etapa só ganha default melhor).
- Reposicionar um gate "a revisar" em uma amostra oferece propagar o
  deslocamento para as demais (reuso do escopo de propagação já
  existente).
- Gate revisado perde o badge — a árvore mostra o progresso da revisão
  ("3 de 8 amostras revisadas").

### 4. Casos de borda

- Canal exigido ausente no alvo → mapeamento impossível para aquele
  papel; o usuário decide entre trocar o papel para outro canal ou
  aplicar o template parcialmente (sub-árvore que depende do papel
  fica de fora, listada no relatório).
- Amostra com painel divergente dentro do mesmo experimento → entra no
  relatório como incompatível, não falha o lote.
- Template aplicado não cria vínculo: editar a análise herdada não
  altera o template nem outras aplicações.

## Arquivos a tocar (direção, não contrato)

- `src/features/templates/` — feature nova: lista de templates,
  dialog de salvar, wizard de aplicar (mapeamento de canais → escopo
  → dry-run), estado "a revisar".
- `src/page/experiments/Card/index.tsx` — item de menu "Aplicar
  template de análise".
- `src/features/experiment/components/parent-tree/GateTreeItem.tsx` —
  badge "a revisar" + progresso de revisão.
- `src/features/plot/` — overlay opcional indicando gates oriundos de
  template na amostra ativa.
- `src/services/` — client dos endpoints de template (depende do
  backend novo).
- `docs/TRACKER.md` — linha da frente.

## Critérios de aceite

- [ ] Salvar template a partir de amostra analisada persistindo
      hierarquia, tipos de gate e papéis de canal.
- [ ] Wizard de aplicação com mapeamento de canais obrigatório e
      pré-sugestão por nome de canal.
- [ ] Gates herdados nascem com marcação "a revisar"; revisão remove a
      marcação e propaga deslocamento por escopo.
- [ ] Amostra com gates existentes é pulada; relatório final lista
      casadas/puladas/incompatíveis.
- [ ] Painel divergente não falha o lote — vai para o relatório.
- [ ] Template editável/removível sem afetar análises já aplicadas.
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm build` limpos.

## Fora de escopo

- **Versionamento de template** (histórico/rollback da estratégia) —
  conversa com a retomada do FE-29 pós-v1; o template nasce como
  objeto mutável simples.
- **Detecção automática de controles** — depende de BE-26/FE-34/35;
  o v0 aceita indicação manual na etapa de ajuste.
- **Auto-fit de gates** (reposicionar geometria por densidade da nova
  aquisição) — fase posterior; o v0 reposiciona pelo usuário com
  propagação.
- Templates compartilhados entre organizações / biblioteca pública.
- Aplicação parcial salva como novo template derivado.
