# ---------- DEPS STAGE ----------
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lockb* bun.lock* ./

RUN bun install

# ---------- BUILD STAGE ----------
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lockb* bun.lock* ./

COPY . .
COPY .env.prod .env

RUN bun run build

# ---------- RUNNER STAGE ----------
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]