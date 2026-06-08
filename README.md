# Pandora Front

Front-end do Projeto Pandora — uma plataforma para análise de citometria de fluxo.

Construído com [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [MUI](https://mui.com/) e empacotado com [Vite](https://vitejs.dev/).

## Requisitos

- Node.js 18+ (recomendado 22)
- Yarn

## Configuração

Copie o arquivo de exemplo de variáveis de ambiente e ajuste conforme necessário:

```bash
cp .env.example .env
```

Variáveis de ambiente expostas ao cliente precisam do prefixo `VITE_`:

- `VITE_API_URL` — URL base da API do Pandora (padrão: `http://localhost:8085`).

## Scripts

Na pasta do projeto, você pode rodar:

### `yarn dev` (ou `yarn start`)

Inicia o servidor de desenvolvimento do Vite em [http://localhost:3000](http://localhost:3000).
A página recarrega automaticamente ao editar os arquivos.

### `yarn build`

Gera o build de produção na pasta `build/`.

### `yarn preview`

Sobe um servidor local para visualizar o build de produção.

### `yarn test`

Roda a suíte de testes com [Vitest](https://vitest.dev/). Use `yarn test:watch` para o modo interativo.

### `yarn typecheck`

Roda o verificador de tipos do TypeScript (`tsc --noEmit`).

## Docker

Ambiente de desenvolvimento com hot reload:

```bash
yarn dev:docker:build   # build + up
yarn dev:docker         # up
```

O build de produção é servido via Nginx (veja o `Dockerfile`).
