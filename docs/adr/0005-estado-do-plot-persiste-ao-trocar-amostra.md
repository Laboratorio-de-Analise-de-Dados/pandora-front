# ADR-0005 — A seleção de canais persiste ao trocar de amostra/gate

- **Status:** Aceito
- **Data:** 2026-08-29
- **Contexto do código:** `ExperimentWorkspaceContext`, página de experimento (carry-forward de eixos)

## Contexto

Ao navegar entre amostras ou gates, o `plot_config` salvo no gate destino
sobrescrevia os eixos escolhidos pelo usuário. Comparar a mesma dupla de canais
entre 20 amostras exigia reescolher os eixos 20 vezes — o fluxo mais comum da
ferramenta era o mais caro.

## Decisão

Os eixos/escala atuais são estado do **workspace**, não do gate: ao trocar de
amostra ou de gate, a seleção corrente é mantida (carry-forward), e o
`plot_config` persistido só é usado quando não há seleção corrente (primeira
abertura). Os canais só mudam quando o usuário muda.

## Alternativas consideradas

### A) Sempre aplicar o `plot_config` do gate destino

Descartada: é o comportamento reclamado no teste.

### B) Não persistir `plot_config` em nenhum gate

Descartada: a primeira abertura de um gate precisa de um default sensato, e o
usado na criação é o melhor palpite.

### C) Alternar com um toggle "travar eixos"

Descartada: resolve com configuração um caso em que existe um default
obviamente melhor; sobrecarrega a UI.

## Consequências

- O default de um gate recém-aberto pode ser "herdado" da navegação em vez do
  que foi salvo — coerente com a expectativa de comparação.
- O estado do plot precisa viver no contexto do workspace, então componentes de
  plot não podem guardar eixos em estado local.
