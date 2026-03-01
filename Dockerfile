FROM node:25-alpine as builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile
COPY . ./
RUN pnpm build

FROM nginx:1.29-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
EXPOSE 80
