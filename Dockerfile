FROM node:22-alpine AS build
# Copia os arquivos de dependência do Yarn
COPY package.json yarn.lock ./

# Instala dependências (sem as dev, se for produção)
RUN yarn install --production=true

# Copia o restante do projeto
COPY . .

# Gera o build do React
RUN yarn build


