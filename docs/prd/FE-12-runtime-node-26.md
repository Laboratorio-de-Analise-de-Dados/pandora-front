# FE-12 — Runtime Node 26, pnpm e atualização de dependências

**Repo:** pandora-front · **Tipo:** refactor/chore · **Base:** `main`
**Branch:** `refactor/node-26-upgrade`
**Status:** entregue na branch; PR pendente.

## Problema

- Dockerfiles pinados em `node:22-alpine`, duas majors atrás do runtime atual.
- O `COPY package*.json ./` do Dockerfile de produção não incluía o lockfile,
  então `--frozen-lockfile` rodava sem verificação real.
- Yarn 1.x em modo manutenção: install de ~93s no build Docker e hoisting
  permissivo escondendo phantom deps (ver ADR-0009).
- Typecheck com 8 erros após o bump em curso para TypeScript 7
  (`moduleResolution: bundler`), tornando a verificação inútil como gate.
- Minors/patches acumulando atraso e `@types/node` desalinhado do runtime.

## Escopo

### 1. Runtime e package manager

- `Dockerfile` e `Dockerfile.dev` passam a `node:26-slim`.
- Yarn 1.x → **pnpm 12** (`packageManager` + `engines: pnpm ^12`); a imagem
  Node 26 não embute yarn/corepack, então o gerenciador é provido via
  `npm install -g pnpm` (ver ADR-0007 e ADR-0009).
- `pnpm-lock.yaml` (gerado por `pnpm import`) é a fonte de verdade;
  `yarn.lock` sai do repo. `COPY` explícito de lockfile + `pnpm-workspace.yaml`.
- `pnpm-workspace.yaml`: `allowBuilds` (esbuild, es5-ext) e
  `peerDependencyRules.allowedVersions` para os mismatches já conhecidos.

### 2. Dependências (somente dentro das faixas declaradas)

- Upgrade geral dentro de faixa: react-query, axios, styled-components,
  `@types/react(-dom)`, `@mui/x-tree-view`, `@fontsource/roboto`, etc.
- `@types/node` elevado a `^26` (major de tipagem, alinha com o runtime).
- `@testing-library/jest-dom` sobe para ^6 (entrada `/vitest` tipa os matchers)
  e os pacotes `@testing-library/*` movem para `devDependencies`.
- Majores fora de faixa **não** atualizados (ver "Fora de escopo").

### 3. Typecheck zerado

- `src/types/styled.d.ts` (novo): `DefaultTheme` do styled-components estende o
  `Theme` do MUI — a ThemeProvider já injeta o tema MUI no styled.
- Plotly: `title` dos eixos passa a `{ text }` (as tipagens não aceitam mais
  string solta).
- `Experiment.organization` vira `Organization | null` — o runtime já tratava
  null em `page/experiments` e na checagem de permissão — e a comparação usa
  `organization?.id`.
- `Footer.test.tsx` importa `expect`/`test` do vitest explicitamente
  (phantom-global que o hoisting do yarn escondia).

### 4. Husky + commitlint + prettier

- `.husky/pre-commit`: `lint-staged` (prettier nos staged) + `typecheck`.
- `.husky/commit-msg`: commitlint com config-conventional.
- Passada única de prettier normalizando o repo (commit `style:` separado).

## Arquivos tocados

- `Dockerfile`, `Dockerfile.dev`, `package.json`, `pnpm-lock.yaml` (novo),
  `pnpm-workspace.yaml` (novo), `yarn.lock` (removido), `.gitignore`,
  `.prettierignore` (novo), `commitlint.config.js` (novo), `.husky/` (novo),
  `README.md`, `AGENTS.md`
- `tsconfig.json` (bump de TS7 que já estava na working tree)
- `src/types/styled.d.ts` (novo), `src/types/ExperimentTypes.ts`,
  `src/setupTests.ts`, `src/components/footer/Footer.test.tsx`
- `src/components/plotly/index.tsx`
- `src/features/experiment/hooks/useExperimentPageActions.ts`
- `.devin/` (config de permissões + skill `prd-adr`)

## Critérios de aceite

- [x] `pnpm typecheck` sem erros
- [x] `pnpm test` — 31 testes passando
- [x] `pnpm build` ok
- [x] `docker build` de produção completo em `node:26-slim` + pnpm (~8s de
      install vs ~93s com yarn)
- [ ] CI verde no merge para `main` (build + push da imagem)

## Fora de escopo

- Upgrades de major: React 19, MUI 9, Vite 8/Vitest 5, react-router 7,
  Plotly 4, web-vitals 6 — cada um pede migração de código e PR próprio.
- Mismatches de peer (x-data-grid/x-charts v6 pedem MUI ^5) tolerados via
  `peerDependencyRules` até o upgrade de major correspondente.
