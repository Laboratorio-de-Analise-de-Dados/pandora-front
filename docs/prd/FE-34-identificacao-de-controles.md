# FE-34 — Identificação de controles pós-processamento

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/control-tagging`
**Status:** não iniciado (depende do BE-26 — marcação por amostra,
`suggested_control` na listagem).

## Problema

A informação "qual amostra é controle" só existe se o usuário disser, e
hoje dizer é trabalhoso: entrar em cada subsample pela árvore, lembrar
qual arquivo era o quê. O momento certo de perguntar é quando o
processamento termina — a pessoa acabou de subir o experimento e ainda
lembra o desenho dele. Não perguntar ali é perder a informação para
sempre (o Juvia depende dela para derivar gates).

## Escopo

### 1. Gatilho pós-processamento

Quando `status` transiciona para `done` (chip do FE-26, retomada do
FE-33), mostrar chamada **não-bloqueante** — toast/banner "Identificar
controles?" — abrindo a view de marcação. Pular é sempre válido: a
marcação continua acessível depois (item "Identificar controles" no
menu ⋮ do card e/ou na árvore).

### 2. View de marcação (lista)

Superfície dedicada dentro do experimento — overlay/painel no padrão de
histórico e compensação (não dialog MUI: taguear N amostras é trabalho,
não confirmação — ADR-0014). Lista as amostras ativas com:

- `file_name` + subsample
- tag atual quando já marcada
- `suggested_control` do backend **pré-aplicado na UI mas visualmente
  distinto** (borda tracejada/chip "sugerido") — confirmar transforma
  sugestão em marcação; a heurística nunca grava sozinha
- Seletor de tipo por amostra: `Amostra` (default) | `NM` (unstained) |
  `Single color` | `FMO` | `Isotipo` | `Beads` | `Biológico` — com
  select do canal fluorescente quando o tipo exige (single/fmo/
  isotipo/beads; mesmos canais da compensação)
- Confirmar → PATCH em lote `PATCH /experiment/<id>/controls/`; erros
  por item voltam destacados na linha da amostra

### 3. Escada de contexto

A view é a mesma; o que muda é o quanto chega preenchido: nomes
informativos trazem sugestões (confirmação rápida), nomes opacos
(`Specimen_001_A1_A01.fcs`) chegam limpos e a pessoa indica na mão.
Experimento de placa (`well_id`/`plate` na listagem) é o modo grade —
FE-35.

## Arquivos a tocar

- `src/services/` — `controlsService.ts` (PATCH em lote + tipos)
- `src/features/` nova pasta `controls/` — `useControlTagging`,
  `ControlTaggingView`, seletor de tipo/canal, utils de sugestão
- `src/page/experiments/Card` — item no menu ⋮
- `src/types/` — `ControlType`, `SuggestedControl`, campos novos em
  `ExperimentFiles`

## Critérios de aceite

- [ ] Chamada de identificação aparece quando o processamento termina
- [ ] Sugestões vêm pré-marcadas e distinguíveis das confirmadas
- [ ] Canal é exigido só nos tipos que o backend valida
- [ ] Confirmar grava em lote; erro por amostra aparece na linha
- [ ] Pular/reabrir a qualquer momento pela árvore ou card

## Fora de escopo

- Mapa de placa 96 poços — FE-35
- Marcação por subsample para compensação — já existe (FE-27), não muda
