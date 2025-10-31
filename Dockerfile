FROM node:22-alpine AS build

WORKDIR /app

# Copia apenas os arquivos de dependência primeiro
COPY package.json ./

# Instala dependências com cache
RUN yarn install --production=true --no-lockfile

# Agora copia o restante do projeto
COPY . .

# Gera o build
RUN yarn build