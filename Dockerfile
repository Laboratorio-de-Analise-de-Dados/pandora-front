FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN yarn
COPY . .
RUN yarn build