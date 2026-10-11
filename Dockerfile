# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS final

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-environment.sh /docker-entrypoint.d/40-environment.sh
# The script may come from a Windows checkout: drop CRLF and make sure nginx runs it.
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-environment.sh && chmod +x /docker-entrypoint.d/40-environment.sh

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
