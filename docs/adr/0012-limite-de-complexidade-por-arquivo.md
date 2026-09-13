# ADR-0012 — Um domínio por arquivo: decompor componentes e hooks que cruzam domínios

- **Status:** Aceito
- **Data:** 2026-02-12
- **Contexto do código:** `src/components/parent_tree/index.tsx`,
  `src/features/experiment/hooks/useExperimentPageActions.ts`,
  `src/components/stats_panel/index.tsx`, `src/page/organizations/index.tsx`

## Contexto

A revisão estrutural encontrou arquivos que cresceram juntando
responsabilidades de domínios diferentes:

- `parent_tree/index.tsx` (1044 linhas): `renderGate`, `renderFile` e
  `renderSubsampleGroup` são componentes disfarçados de função recebendo um
  "handlers bag" de ~14 callbacks; o componente principal ainda acumula ~15
  `useState` de menus, seleção em lote e diálogos.
- `useExperimentPageActions.ts` (588 linhas): um hook orquestra quatro
  domínios — metadados do experimento, amostras, gates e subsamples.
- `page/organizations/index.tsx` (419 linhas): três tabs inline com
  handlers próprios.

O padrão que emerge: cada file/gate/subsample tem seu próprio estado de
menu, diálogo e handler, e o arquivo anfitrião vira o acumulador de tudo.

## Decisão

Regra prática para componentes e hooks:

1. **Um domínio por arquivo.** Um hook ou componente que orquestra ações de
   domínios distintos é dividido por domínio (ex.:
   `useExperimentPageActions` → `useFileActions`, `useGateActions`,
   `useSubsampleActions`, `useExperimentMeta`) e, se a página precisar de
   todos, compõe na camada da página.
2. **Render-function vira componente.** Função que retorna JSX e recebe um
   objeto "handlers" com mais de um punhado de callbacks vira componente
   nomeado com props próprias (`renderGate` → `GateTreeItem`).
3. **Estado de interação vira hook.** Conjunto de `useState`+handlers que só
   serve a interações do componente (menus, seleção em lote, alvos de
   diálogo) extrai para um hook na mesma pasta
   (`useTreeInteractions`, `useSubsampleDialogs`).
4. Sinais de alerta na revisão (não números rígidos): arquivo >~300 linhas,
   > 8 estados locais, ou um objeto "handlers" passado para funções de
   > render.

## Alternativas consideradas

### A) Regra numérica rígida (ex.: máx. 300 linhas)

Descartada: comprimento é sintoma, não causa — um painel de 400 linhas com
um único domínio pode estar saudável. O critério é domínio/coerência, com
tamanho como heurística de alerta.

### B) Deixar o acúmulo (status quo)

Descartada: o custo já aparece — `parent_tree` exige ler 600 linhas de
gestão de menus antes de chegar no render, e mudança em um domínio recompila
e arrisca os outros três.

## Consequências

- Arquivos menores com uma razão de mudança; testes de hook/util ficam
  direcionados.
- O boilerplate de props aumenta um pouco — mitigado porque os hooks
  extraídos devolvem exatamente o pacote de estado que o componente precisa.
- Dívida: sem enforcement mecânico; depende de revisão até um lint de
  fronteira/complexidade ser adotado (ver ADR-0008).
