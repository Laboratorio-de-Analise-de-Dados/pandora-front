# FE-27 — Indicadores de histórico e compensação ao lado do nome do arquivo

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/indicadores-analise`
**Status:** não iniciado — backend completo em `feat/analysis-checkpoints`
(pandora-backend, BE-22 + BE-08/BE-20).

## Problema

A compensação é invisível hoje: o usuário não vê se a amostra traz matriz
embutida (`$SPILLOVER`/`$COMP`), se há uma matriz aplicada no experimento,
nem tem entrada para gerenciá-la. O histórico/checkpoints (FE-25) existe,
mas escondido atrás de um ícone no fim da barra do plot — fora do contexto
"de qual arquivo estou falando".

Direção do usuário: **os ícones de histórico e compensação ficam ao lado
do nome do arquivo**, na linha de navegação que já tem o seletor de fonte
(`SourceDropdown` + anterior/próximo) — na mesma zona dos controles de
escala/limites ("passadores") da `PlotToolbar`, que é logo abaixo.

## Escopo

### 1. `CompensationIndicator` — ícone ao lado do nome do arquivo

Novo ícone na linha de navegação (`sourceNav` em
`src/page/experiment/[id]/index.tsx`) — **logo após os botões
anterior/próximo**, antes do cluster da direita: `SourceDropdown` →
prev/next → compensação → histórico. Três estados:

- **Sem matriz nenhuma**: ícone ausente ou esmaecido (decisão de design —
  esmaecido educa que a feature existe; ausente polui menos).
- **Amostra atual traz matriz embutida e nada aplicado**: ícone com
  badge/ponto — tooltip "Esta amostra traz matriz de compensação
  ($SPILLOVER)". Usa `has_embedded_compensation` do arquivo selecionado.
- **Matriz aplicada no experimento**: ícone preenchido/`primary` —
  tooltip "Compensação aplicada: \<nome\>". Fonte: `is_applied` em
  `GET /experiment/<id>/compensations/`.

Sugestão de glifo: `MdOutlineBlurOn`/`MdTune`/`MdOpacity` do react-icons —
escolher o que remeta a "correção espectral" sem confundir com gate.

### 2. Histórico em dois níveis: amostra × experimento

Dois pontos de entrada, dois recortes — sem toggle dentro do painel:

- **Junto do arquivo** (`sourceNav`, logo após prev/next — mesma posição
  do indicador de compensação): abre o
  `HistoryPanel` recortado — `GET .../history/?file=<file_data_id>`
  devolve só o que toca a amostra aberta + as ações experiment-wide
  (`file_data` `null`: compensação, restore etc. afetam todas). O painel
  indica o recorte no título ("Histórico — a1.fcs").
- **Junto do experimento**: um botão de ação no nível do experimento —
  no card da listagem (menu ⋮ ou botão ao lado de editar/detalhes) e/ou
  no topo do workspace. Abre o mesmo `HistoryPanel` sem o parâmetro
  `file` → timeline completa. No modo "tudo", cada linha ganha o rótulo
  da amostra quando `file_data` não é null (o item já expõe esse campo).

O `MdHistory` que hoje fica no fim da `PlotToolbar` vira o botão do nível
amostra na `sourceNav` (ou no cluster do experimento — ver qual leitura
fica mais clara; os dois painéis são o mesmo componente com `file`
opcional).

### 3. Marcação por amostra na árvore e no seletor

`list/data` já devolve `has_embedded_compensation` por arquivo:

- `FileTreeItem`: ícone discreto ao lado de `📄 nome.fcs` quando a amostra
  traz matriz (tooltip "Traz matriz de compensação").
- `SourceDropdown` (itens do menu): mesmo indicador nos itens `file`.

### 4. `CompensationPanel` — drawer/sheet como o `HistoryPanel`

Abre pelo `CompensationIndicator`; mesmo padrão `CollapsiblePanel`
(drawer direito desktop, bottom sheet mobile). Conteúdo:

- **Estado atual**: matriz aplicada (nome, origem, canais) ou "nenhuma".
- **Matriz embutida**: preview de `GET .../compensations/embedded`
  (canais + tabela N×N) quando houver; botão **"Usar do arquivo"** →
  `POST .../compensations/from-header {"apply": true}` (materializa e
  aplica num passo).
- **Matrizes do experimento**: lista de `GET .../compensations/` com
  aplicar (`POST .../<id>/apply`), remover (`POST .../remove`),
  renomear/descartar (`PATCH`/`DELETE /analytics/compensations/<id>/`).
- **Calcular de controles**: `POST .../compute` — sem payload deriva dos
  subsamples marcados; a marcação acontece no menu da amostra/subsample
  (abaixo).
- Badge "Compensado" no card de experimento da listagem
  (`experiment.compensated` — já sai no backend).

### 5. Marcar controles nos subsamples

O `PATCH /experiment/<id>/subsamples/<id>/` aceita `control_type`
(`unstained`/`single_stain`) + `control_channel`. No menu de contexto do
subsample (ou diálogo de criação): "Marcar como controle" → tipo + canal
fluorescente. Erros 400 do back nomeiam o conflito (canal já coberto,
unstained duplicado) — exibir o `detail` direto.

### 6. Sinal na linha de dados (consistência)

Com compensação aplicada, density/stats/preview/list-data já vêm
compensados do backend — nenhum tratamento extra nos dados; só o
indicador visual muda.

## Arquivos a tocar

- `src/features/compensation/` (novo): `compensationService.ts`,
  `useCompensationQuery`, `useCompensationActions`, `CompensationPanel`,
  `CompensationIndicator`.
- `src/page/experiment/[id]/index.tsx` — `sourceNav`: indicador + ícone
  de histórico; `CollapsiblePanel` do painel.
- `src/features/experiment/components/SourceDropdown.tsx` — indicador
  nos itens de arquivo.
- `src/features/experiment/components/parent-tree/FileTreeItem.tsx` —
  marcador na linha da amostra.
- `src/types/ExperimentTypes.ts` — `has_embedded_compensation` em
  `ExperimentFiles`; `compensated` em `Experiment`.
- `src/features/plot/.../PlotToolbar.tsx` — remover/mover o ícone de
  histórico para o cluster do arquivo.
- Menu de contexto de subsample (marcação de controle).
- Card de experimento — badge "Compensado".

## Contrato do backend (já em `feat/analysis-checkpoints`)

```
GET    /experiment/<id>/compensations/            lista de matrizes
GET    /experiment/<id>/compensations/embedded    matriz $SPILLOVER crua (204 = nenhuma)
POST   /experiment/<id>/compensations/from-header {name?, apply?} → 201 | 409
POST   /experiment/<id>/compensations/compute     {name?, negative?, controls?} → 201 | 400
POST   /experiment/<id>/compensations/<mid>/apply
POST   /experiment/<id>/compensations/remove
PATCH  /analytics/compensations/<id>/             {name}
DELETE /analytics/compensations/<id>/             soft delete (desliga se aplicada)
PATCH  /experiment/<id>/subsamples/<id>/          {control_type, control_channel}
GET    /experiment/list/data/<id>/                item.has_embedded_compensation
GET    /experiment/                               item.compensated
```

## Critérios de aceite

- [ ] Ícone de compensação ao lado do nome do arquivo com 3 estados
      (nenhuma / embutida disponível / aplicada) + tooltip explicativo.
- [ ] Histórico em dois níveis: ícone junto do arquivo abre o painel
      recortado (`?file=`), ação no nível do experimento abre a timeline
      completa com rótulo de amostra por linha.
- [ ] Amostra com matriz embutida marcada na árvore e no `SourceDropdown`.
- [ ] Painel: preview da embutida, "usar do arquivo" em 1 clique, lista de
      matrizes com apply/remove, renomear e descartar.
- [ ] Marcação de controle no subsample (unstained/single-stain+canal) e
      botão "calcular dos controles" com erros 400 legíveis.
- [ ] Badge "Compensado" no card da listagem.
- [ ] Invalidar queries certas após apply/remove (densidade, stats,
      preview, list/data — o back já muda o resultado).

## Fora de escopo

- Edição célula-a-célula da matriz (`source="manual"` existe, UI depois).
- Visualização gráfica do efeito (antes/depois no mesmo plot).
- Auto-aplicar no upload (decisão de produto — hoje é ação explícita).
