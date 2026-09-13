# ADR-0009 — pnpm como package manager (substitui Yarn 1.x)

- **Status:** Aceito
- **Data:** 2026-09-13
- **Contexto do código:** `package.json` (`packageManager`, `engines`), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `Dockerfile`, `Dockerfile.dev`, `.husky/`

## Contexto

Yarn 1.x (Classic) está em modo manutenção e era provido por instalação global
nos containers. Dois sintomas concretos: install lento (~93s no build Docker,
~60s local) e hoisting permissivo que escondia problemas — ex.: `Footer.test.tsx`
usava globals de teste sem import, e `@testing-library/*` morava em
`dependencies` (seria instalado em produção). Com o Node 26 sem corepack/yarn
embutidos, o momento de trocar era agora, junto do bump de runtime.

## Decisão

Migrar para **pnpm** (`packageManager: pnpm@12.4.1`):

- `pnpm-lock.yaml` gerado via `pnpm import` a partir do `yarn.lock` e passa a
  ser a fonte de verdade; `yarn.lock` sai do repo e entra no `.gitignore`.
- `engines`: `node>=22`, `pnpm ^12`.
- `pnpm-workspace.yaml` concentra as exceções declaradas:
  - `allowBuilds`: `esbuild`, `es5-ext` (build scripts necessários)
  - `peerDependencyRules.allowedVersions`: reconhece os mismatches já
    existentes — `x-data-grid`/`x-charts` v6 pedem MUI ^5 e rodamos MUI 7;
    `@types/react` 19 vs. peer ^18 do testing-library. Explícito em vez de
    warning ignorado.
- Hooks do husky e scripts usam `pnpm` (`pnpm lint-staged`, `pnpm typecheck`,
  `pnpm commitlint`).

Ajustes forçados pela estrutura estrita:

- `Footer.test.tsx` passa a `import { expect, test } from "vitest"` (globals
  vazavam via hoisting no yarn).
- `@testing-library/jest-dom` sobe para ^6 e o setup importa
  `@testing-library/jest-dom/vitest` — entrada que tipa os matchers para o
  vitest.
- `@testing-library/*` movidos para `devDependencies`.

## Alternativas consideradas

### A) Manter Yarn 1.x

Descartada: linha em manutenção, install ~12x mais lento no build Docker e o
hoisting esconde phantom deps — exatamente o tipo de problema que o pnpm
exposto acima revelou.

### B) Yarn Berry (4.x) via corepack

Descartada: exige instalar corepack via npm (não vem mais no Node 26), muda o
formato do lockfile e o modelo de resolução (PnP) — migração mais intrusiva
que pnpm, com menos ganho prático para um app sem monorepo.

### C) npm

Descartada: funciona, mas mantém node_modules flat + install mais lento e sem
a disciplina de peers que motivou a troca.

## Consequências

- `pnpm install` no build Docker: ~8s (era ~93s com yarn). Local: ~2s.
- node_modules estrito: import de pacote não declarado quebra na hora —
  phantom deps viram erro, não silêncio.
- Scripts do `package.json` não mudam de nome (`pnpm dev`, `pnpm test`...);
  README/AGENTS.md atualizados.
- Dívida: os mismatches de peer (MUI v6 x-components vs MUI 7) ficam
  tolerados via `allowedVersions` até o upgrade de major correspondente.
