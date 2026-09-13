# FE-07 — Padronizar o desenho do gate retangular

**Repo:** pandora-front · **Item do doc:** 15 · **Tipo:** bug · **Base:** `main`
**Branch sugerida:** `fix/rect-gate-drawing`
**Status:** Entregue no PR #45.

## O que já está certo no código

`src/features/plot/hooks/useGateDrawing.ts` já normaliza os cantos:

```ts
startX: Math.min(...xs), endX: Math.max(...xs),
startY: Math.min(...ys), endY: Math.max(...ys),
```

Então o problema não é inversão de cantos. Suspeitas a investigar, em ordem:

1. **Dragmode do Plotly**: com `dragmode: "select"`/`"zoom"` alternando, o mesmo arraste às vezes cria gate e às vezes dá zoom/pan. Ver a config em `src/components/plotly/index.tsx` e o `tool` em `usePlotState` (`tool` começa em `"rect"`).
2. **Conversão de coordenadas**: `toRaw` (biex) aplicado em `useGateDrawing` — em escala biex, o retângulo desenhado na tela pode não corresponder ao retângulo salvo, dando a impressão de "muda de tamanho ao soltar".
3. **Reedição**: `useGateShapeEditing` / `PolygonEditOverlay` — retângulo pode voltar como shape editável de tipo diferente do desenhado.
4. **Clique sem arraste** ou arraste mínimo: gate degenerado (área ~0) sendo criado sem aviso.

## Escopo

1. Reproduzir e documentar no MR **qual** o comportamento inconsistente (gravar o passo a passo; usar heatmap e scatter, escala linear e biex).
2. Padronizar: um único gesto para criar retângulo (arraste com a ferramenta "rect" ativa), com preview igual ao resultado final em qualquer escala.
3. Rejeitar gate degenerado (largura ou altura abaixo de um mínimo em pixels) com toast, em vez de criar um gate vazio.
4. Teste unitário da conversão tela → coordenadas do dado para os dois tipos de escala.

## Critérios de aceite

- [ ] O retângulo salvo coincide com o preview desenhado, em linear e em biex, nos dois modos de plot.
- [ ] Desenhar a partir de qualquer canto dá o mesmo gate.
- [ ] Clique sem arraste não cria gate.
- [ ] Reabrir o gate para reedição mostra o mesmo retângulo.
- [ ] MR descreve o comportamento reproduzido antes/depois.
