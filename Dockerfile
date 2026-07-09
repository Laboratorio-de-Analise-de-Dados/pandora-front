# Etapa de build
FROM node:22-alpine AS build
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN yarn install --frozen-lockfile

# Copia o restante do código e gera o build
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN yarn build

# Etapa final: Nginx servindo os arquivos
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]