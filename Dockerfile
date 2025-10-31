# Etapa de build
FROM node:22-alpine AS build
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN yarn install --frozen-lockfile --production=true

# Copia o restante do código e gera o build
COPY . .
RUN yarn cache clean && NODE_OPTIONS="--max-old-space-size=4096" yarn build

# Etapa final: servidor estático
FROM node:22-alpine AS final
WORKDIR /app

# Instala o servidor estático
RUN yarn global add serve

# Copia os arquivos de build
COPY --from=build /app/build ./build

# Expõe a porta padrão
EXPOSE 3000

# Comando de inicialização
CMD ["serve", "-s", "build", "-l", "3000"]