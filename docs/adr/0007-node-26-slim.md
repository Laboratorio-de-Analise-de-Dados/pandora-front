# ADR-0007 — Node 26-slim nos containers

- **Status:** Aceito
- **Data:** 2026-09-13
- **Contexto do código:** `Dockerfile`, `Dockerfile.dev`, `package.json` (`engines`)

## Contexto

As imagens oficiais `node:26-*` não embutem mais Yarn nem Corepack (o Corepack
foi removido do Node 25+), então subir a base de `node:22-alpine` para Node 26
exigia repensar como o package manager é provido. Em paralelo, o
`COPY package*.json ./` do Dockerfile de produção não incluía o lockfile, ou
seja, `--frozen-lockfile` nunca verificou lockfile de fato.

## Decisão

1. Imagens pinadas em `node:26-slim` (build de produção e dev).
2. `COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./` explícito nos dois
   Dockerfiles — o lockfile sempre acompanha o manifest.
3. `engines` declara `node>=22` para não bloquear desenvolvimento local em
   versões intermediárias; 26 é a referência nos containers.
4. Package manager provido por `npm install -g` dentro da imagem (ver ADR-0009
   para a escolha do gerenciador).

## Alternativas consideradas

### A) `node:26-alpine`

Descartada: musl libc quebra binários pré-compilados e `node-gyp` de parte do
ecossistema (a árvore do plotly/regl e dependências nativas de teste). `slim`
mantém glibc com tamanho ainda enxuto.

### B) Manter `node:22-alpine`

Descartada: adia o problema sem reduzir risco. Node 22 está em LTS de
manutenção e 26 vira a linha LTS ativa a partir de out/2026.

## Consequências

- O CI (`docker build` + push) segue igual; nenhuma mudança no workflow.
- `--frozen-lockfile` passa a verificar de verdade: um install local que gere
  lockfile divergente quebra o build — comportamento desejado.
- `tsconfig.tsbuildinfo` e lockfiles concorrentes (`package-lock.json`,
  `yarn.lock`) entram no `.gitignore` como artefatos a não commitar.
