# ADR-0007 — Node 26-slim nos containers; Yarn 1.x via npm global

- **Status:** Aceito
- **Data:** 2026-09-13
- **Contexto do código:** `Dockerfile`, `Dockerfile.dev`, `package.json` (`engines`), `yarn.lock`

## Contexto

As imagens oficiais `node:26-*` não embutem mais Yarn nem Corepack (o Corepack
foi removido do Node 25+). Subir a base de `node:22-alpine` para Node 26
quebrava o `RUN yarn install` dos dois Dockerfiles. Em paralelo, o
`COPY package*.json ./` do Dockerfile de produção não incluía `yarn.lock`, ou
seja, `--frozen-lockfile` nunca verificou lockfile de fato.

## Decisão

1. Imagens pinadas em `node:26-slim` (build de produção e dev).
2. Yarn 1.x (Classic) instalado via `npm install -g yarn` dentro da imagem;
   `yarn.lock` continua sendo a fonte de verdade das dependências.
3. `COPY package.json yarn.lock ./` explícito nos dois Dockerfiles.
4. `engines` declara `node>=22` para não bloquear desenvolvimento local em
   versões intermediárias; 26 é a referência nos containers.

## Alternativas consideradas

### A) `node:26-alpine`

Descartada: musl libc quebra binários pré-compilados e `node-gyp` de parte do
ecossistema (a árvore do plotly/regl e dependências nativas de teste). `slim`
mantém glibc com tamanho ainda enxuto.

### B) Corepack para prover Yarn

Indisponível: o Node 26 não distribui mais o Corepack. Instalá-lo via npm só
para habilitar o Yarn adiciona uma camada sem benefício sobre o
`npm i -g yarn` direto.

### C) Migrar para npm/pnpm

Descartada neste PR: trocar o package manager invalida o `yarn.lock`
resolvido e mistura lockfiles — risco fora de escopo. Yarn 1.x está em modo
manutenção; reavaliar quando houver motivo concreto (ex.: workspaces,
resolução, segurança de supply chain).

### D) Manter `node:22-alpine`

Descartada: adia o problema sem reduzir risco. Node 22 está em LTS de
manutenção e 26 vira a linha LTS ativa a partir de out/2026.

## Consequências

- O CI (`docker build` + push) segue igual; nenhuma mudança no workflow.
- `--frozen-lockfile` passa a verificar de verdade: um `yarn install` local que
  gere lockfile divergente quebra o build — comportamento desejado.
- Dívida registrada: majors pendentes (React 19, MUI 9, Vite 8/Vitest 5,
  react-router 7, Plotly 4, web-vitals 6) exigem PRs de migração próprios;
  Yarn 1.x é linha em manutenção.
- `package-lock.json` local vira ruído (não commitar; avaliar `.gitignore`) e
  `tsconfig.tsbuildinfo` é artefato do `incremental` — idem.
