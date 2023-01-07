FROM node:19-alpine as base
RUN npm i -g pnpm@7

FROM base as builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile
COPY . ./
RUN pnpm run build

FROM nginx:1.13-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
EXPOSE 80
