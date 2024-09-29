FROM node:22-alpine as builder
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile
COPY . ./
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
EXPOSE 80
