FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ---- Dependencies (full, incl. devDeps) ----
FROM base AS development-dependencies-env
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Production-only dependencies (lean, no devDeps) ----
FROM base AS production-dependencies-env
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ---- Build ----
FROM base AS build-env
WORKDIR /app
COPY . .
COPY --from=development-dependencies-env /app/node_modules ./node_modules
RUN pnpm run build

# ---- Runtime ----
FROM base AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --chown=appuser:appgroup --from=production-dependencies-env /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=build-env /app/build ./build
COPY --chown=appuser:appgroup package.json ./

ENV NODE_ENV=production
ENV PORT=5179
EXPOSE 5179

USER appuser

CMD ["node_modules/.bin/react-router-serve", "./build/server/index.js"]
