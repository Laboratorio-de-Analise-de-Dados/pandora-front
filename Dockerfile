FROM node:22-alpine AS build
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN yarn
COPY . .
RUN yarn build