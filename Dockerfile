# Etapa de build
FROM node:26-slim AS build
WORKDIR /app

# Instala dependências
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copia o restante do código e gera o build
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

# Etapa final: Nginx servindo os arquivos
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]