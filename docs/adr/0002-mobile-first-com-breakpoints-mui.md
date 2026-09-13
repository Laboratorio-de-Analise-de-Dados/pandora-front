# ADR-0002 — Mobile-first com breakpoints do MUI

- **Status:** Aceito
- **Data:** 2026-08-10 (registrado em 2026-09-13)
- **Contexto do código:** `ScatterPlot`, `CollapsiblePanel`, modais, página de grupos

## Contexto

A página de experimento nasceu com larguras fixas em `vw` e três painéis lado a
lado; em telas pequenas o gráfico saía da viewport e os modais não caíam na
tela. Ao mesmo tempo, o uso real é majoritariamente **desktop** — otimizar só
para mobile degradaria o caso principal.

## Decisão

Todo componente novo é escrito mobile-first com breakpoints do MUI
(`xs`, `sm`, `md`), e o desktop recebe o layout mais denso a partir de `sm`/`md`:

- painéis laterais (árvore, estatísticas) viram `Drawer` no mobile via
  `CollapsiblePanel`;
- gráfico e seletores empilham em coluna no `xs` e vão a linha no `md`
  (`flexDirection: { xs: "column", md: "row" }`);
- modais com largura responsiva, `maxHeight: "90vh"` e `overflowY: "auto"`;
- nada de `vw` fixo sem breakpoint;
- comportamento dependente de viewport usa
  `useMediaQuery(theme.breakpoints.down("md"))`, não checagem de user agent.

## Alternativas consideradas

### A) Layout desktop-first com ajustes pontuais para telas pequenas

Descartada: foi o que gerou o problema; o ajuste "pontual" nunca cobre todos os
componentes e a regressão só aparece no celular de alguém.

### B) Rota/app separado para mobile

Descartada: dobra a superfície de manutenção para uma equipe pequena.

### C) Detecção por user agent

Descartada: erra em tablet e em janela de desktop redimensionada; breakpoint
descreve o que importa (espaço disponível).

## Consequências

- Todo componente precisa ser pensado em dois layouts desde o primeiro commit.
- O desktop não perde densidade porque os breakpoints `md+` continuam com o
  layout largo (a página de grupos, por exemplo, usa até 1200px).
