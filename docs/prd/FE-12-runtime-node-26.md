# FE-12 — Runtime Node 26 nos containers e atualização de dependências

**Repo:** pandora-front · **Tipo:** refactor/chore · **Base:** `main`
**Branch:** `refactor/node-26-upgrade`
**Status:** entregue na branch; PR pendente.

## Problema

- Dockerfiles pinados em `node:22-alpine`, duas majors atrás do runtime atual.
- O `COPY package*.json ./` do Dockerfile de produção não incluía `yarn.lock`,
  então `yarn install --frozen-lockfile` rodava sem lockfile — a proteção era
  ilusória.
- Typecheck com 8 erros após o bump em curso para TypeScript 7
  (`moduleResolution: bundler`), tornando a verificação inútil como gate.
- Minors/patches acumulando atraso e `@types/node` desalinhado do runtime.

## Escopo

### 1. Runtime

- `Dockerfile` e `Dockerfile.dev` passam a `node:26-slim`.
- Yarn provido por `npm install -g yarn` — a imagem Node 26 não embute mais
  yarn nem corepack (ver ADR-0007).
- `COPY package.json yarn.lock ./` explícito nos dois Dockerfiles.
- `engines` no `package.json`: `node>=22`, `yarn ^1.22.0`.

### 2. Dependências (somente dentro das faixas declaradas)

- `yarn upgrade` geral: react-query, axios, styled-components,
  `@types/react(-dom)`, `@mui/x-tree-view`, `@fontsource/roboto`, etc.
- `@types/node` elevado a `^26` (major de tipagem, alinha com o runtime).
- Majores fora de faixa **não** atualizados (ver "Fora de escopo").

### 3. Typecheck zerado

- `src/types/styled.d.ts` (novo): `DefaultTheme` do styled-components estende o
  `Theme` do MUI — a ThemeProvider já injeta o tema MUI no styled.
- Plotly: `title` dos eixos passa a `{ text }` (as tipagens não aceitam mais
  string solta).
- `Experiment.organization` vira `Organization | null` — o runtime já tratava
  null em `page/experiments` e na checagem de permissão — e a comparação usa
  `organization?.id`.

## Arquivos tocados

- `Dockerfile`, `Dockerfile.dev`, `package.json`, `yarn.lock`, `README.md`
- `tsconfig.json` (bump de TS7 que já estava na working tree)
- `src/types/styled.d.ts` (novo), `src/types/ExperimentTypes.ts`
- `src/components/plotly/index.tsx`
- `src/features/experiment/hooks/useExperimentPageActions.ts`

## Critérios de aceite

- [x] `yarn typecheck` sem erros
- [x] `yarn test` — 31 testes passando
- [x] `yarn build` ok
- [x] `docker build` de produção completo em `node:26-slim`
- [ ] CI verde no merge para `main` (build + push da imagem)

## Fora de escopo

- Upgrades de major: React 19, MUI 9, Vite 8/Vitest 5, react-router 7,
  Plotly 4, web-vitals 6 — cada um pede migração de código e PR próprio.
- `package-lock.json` (legado, não rastreado) e `tsconfig.tsbuildinfo`
  (artefato de build) — pendem decisão sobre `.gitignore`.
- Troca de package manager — Yarn 1.x permanece (ADR-0007).
