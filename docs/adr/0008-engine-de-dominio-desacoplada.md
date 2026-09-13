# ADR-0008 — Núcleo de domínio desacoplado de React/MUI/HTTP

- **Status:** Aceito
- **Data:** 2026-09-13
- **Contexto do código:** `src/types/`, `src/utils/`, `src/features/*/utils/`, `src/services/`, `src/features/*/hooks/`, `src/components/`, `src/page/`

## Contexto

A regra de camadas do ADR-0001 (serviço → hook → componente) já vigora por
convenção, e o núcleo já é de fato desacoplado: `utils/` e `types/` só
importam libs de domínio (`xlsx`, tipos) — zero `react`, `axios`, `@mui` ou
`plotly` em código de produção. Mas nada no tooling impede a regressão: um
`utils/` pode passar a importar React e um componente pode voltar a chamar
`axios` sem que nenhuma verificação automática reclame.

A motivação concreta é a portabilidade da engine: transformação biex,
geometria de gates, helpers de árvore e cálculo de estatísticas são a parte
do sistema que pode virar pacote compartilhado (ex.: reuse em CLI, engine de
análise, ou migração de framework) — desde que nunca dependam do ambiente
React.

## Decisão

Formalizar a regra de dependência unidirecional:

```
components/ , page/      (renderização, eventos, navegação)
      ↓
hooks/ , providers/ ,    (adaptação React: estado, side-effects, contexto)
features/*/hooks/ , features/*/context/
      ↓
services/  +  núcleo de domínio
(types/, utils/, features/*/utils/)
```

1. **Núcleo** (`types/`, `utils/`, `features/*/utils/`): TypeScript puro,
   funções sem estado. Proibido importar `react`, `@mui/*`, `axios`,
   `plotly*` ou libs de UI. Exceções por tipo são aceitas quando forem
   `import type` de tipos de dados (ex.: `Theme` do MUI em `styled.d.ts`),
   nunca de runtime. Libs de domínio sem UI (`xlsx`) são permitidas.
2. **`services/`**: único lugar que fala HTTP (`src/API`); devolve tipos do
   núcleo. Sem React.
3. **Hooks/contexts**: única camada que conhece React; adaptam o núcleo para
   estado e ciclo de vida.
4. **Components/pages**: renderização; nada de axios (ADR-0001) nem lógica de
   domínio duplicada — consomem hooks e utils.

Enforcement: convenção + revisão por ora. Quando o eslint for reintroduzido,
avaliar `eslint-plugin-boundaries`/`import/no-restricted-paths` para tornar a
regra mecânica.

## Alternativas consideradas

### A) Clean Architecture completa (entities, use cases, ports/adapters)

Descartada: overhead de indireção desproporcional ao tamanho do front. A regra
de dependência acima já captura o benefício prático (núcleo testável e
portável) sem criar camadas de pass-through.

### B) Extrair o núcleo para um pacote separado (monorepo)

Descartada por ora: não há segundo consumidor. A regra de imports entrega o
mesmo isolamento conceitual; se surgir um segundo cliente (ex.: engine de
análise no backend ou CLI), a extração vira mecânica porque o núcleo já não
depende de React.

### C) Manter apenas a convenção informal

Descartada: foi assim que o componente `Card` terminou acoplado ao
`DefaultTheme` sem tipagem e que hooks terminaram com chamadas HTTP inline no
passado. Regra escrita vira critério de revisão objetivo.

## Consequências

- Utils/hooks/services ficam testáveis sem montar React — os testes atuais de
  `utils/` já demonstram isso.
- Migrar de Plotly, MUI ou até React passa a ser viável por camada, não por
  reescrita.
- Em revisão: `import` de `react`/`@mui`/`axios` dentro de `utils/`/`types/`/
  `services/` é motivo de recusa (com exceção de `import type`).
- Dívida: a regra ainda não tem enforcement automático; depende de revisão
  até o eslint voltar com regras de boundary.
