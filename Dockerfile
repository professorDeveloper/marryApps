# ---------- BASE STAGE ----------
FROM node:22-alpine3.22 AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn install; \
    elif [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm install --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# ---------- BUILD STAGE ----------
FROM node:22-alpine3.22 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY . .
COPY .env.prod .env
RUN npm run build

# ---------- RUNNER STAGE ----------
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html
# Copy the built files from the builder stage
COPY --from=builder /app/dist .
# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]