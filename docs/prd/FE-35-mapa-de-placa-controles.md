# FE-35 — Mapa de placa para identificação de controles

**Repo:** pandora-front · **Tipo:** feature · **Base:** `main`
**Branch sugerida:** `feat/plate-map-controls`
**Status:** não iniciado (depende do FE-34 e do `well_id`/`plate` do
BE-26).

## Problema

Em experimento de placa (CBA, dose-resposta) as amostras são um arquivo
por poço — caso real: 64 arquivos `Specimen_001_A1_A01.fcs` soltos, sem
nome semântico e sem subsample. Marcar por lista é tedioso e, pior,
errado: a pessoa não pensa "arquivo X é controle", pensa no **desenho
da placa** ("coluna 1–2 era controle", "F11–F12 eram brancos"). A UI
certa é a própria placa.

## Escopo

### 1. Grade de placa

Dentro da view de marcação (FE-34), quando a listagem indica placa
(`plate`/`well_id` na maioria das amostras), a lista vira grade —
padrão 96 poços (A–H × 1–12), formato derivado do `PLATE NAME` ou dos
poços observados:

- Célula com arquivo = selecionável; poço **sem arquivo renderiza oco
  e não marca** — só se tagueia o que tem dado (de quebra visualiza
  "faltaram aquisições na placa")
- Hover/toque mostra `file_name`/`$SRC` do poço
- Cor da célula = tag aplicada; `suggested_control` chega pré-pintado
  com borda tracejada até confirmar

### 2. Seleção estilo planilha

- Clique no cabeçalho de linha (`A`…`H`) ou coluna (`1`…`12`) seleciona
  a linha/coluna inteira — controles de placa costumam ser linha ou
  coluna, isso resolve a maior parte do desenho em um clique
- Arrastar retângulo seleciona região (desktop). Mobile (`xs`): toque
  em cabeçalho + toque em poços — arrasto em touch é ruim; se ficar
  pior que a lista, o fallback é o modo lista do FE-34
- Clique / ctrl+clique para poços avulsos

### 3. Aplicação de tag

Barra de tags sob a grade aplica na seleção — mesmos tipos e regra de
canal do FE-34. Confirmar vai pelo mesmo PATCH em lote do BE-26; o
mapa é só a camada de seleção sobre o mesmo contrato.

## Arquivos a tocar

- `src/features/controls/` — `PlateMap`, `usePlateSelection`, utils
  `wellGrid.ts` (poço → célula, detecção de placa, formato da grade)
  com testes colocados
- View de marcação do FE-34 ganha o modo grade

## Critérios de aceite

- [ ] Grade só aparece quando o backend detecta placa — demais casos
      caem na lista
- [ ] Poço sem arquivo não é selecionável e é visualmente oco
- [ ] Seleção por linha, coluna, região arrastada e poços avulsos
- [ ] Tag na seleção pinta as células; confirmar grava em lote
- [ ] Mobile funciona por toque ou cai na lista — nunca quebra o layout

## Fora de escopo

- Desenho completo da placa (condições, réplicas, curva padrão) — a
  grade é desenhada para estender a isso depois, mas a v1 tagueia só
  controle vs. amostra
- Formatos ≠ 96 poços (24/48/384): a grade deriva o formato dos dados;
  formato não reconhecido cai na lista
