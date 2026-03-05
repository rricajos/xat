# ============================================
# Multi-stage Dockerfile for Xat web app
# Supports: web server, worker process
# ============================================

# --- Stage 1: Base ---
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

# --- Stage 2: Dependencies ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# --- Stage 3: Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @xat/db build && \
    pnpm --filter @xat/shared build && \
    pnpm --filter @xat/web build

# --- Stage 4: Production ---
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and production deps
COPY --from=build /app/apps/web/build ./build
COPY --from=build /app/apps/web/server.js ./server.js
COPY --from=build /app/apps/web/worker.js ./worker.js
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

# Default: run the web server. Override CMD for worker.
CMD ["node", "server.js"]
