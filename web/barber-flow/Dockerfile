FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# ---- Dependencies (full, incl. devDeps + prisma generate) ----
FROM base AS development-dependencies-env
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate

# ---- Build (type-check + vite build) ----
FROM base AS build-env
WORKDIR /app
ARG VITE_ORBIT_API_URL
ENV VITE_ORBIT_API_URL=$VITE_ORBIT_API_URL
COPY . .
COPY --from=development-dependencies-env /app/node_modules ./node_modules
RUN pnpm run build

# ---- Runtime ----
FROM base AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --chown=appuser:appgroup --from=development-dependencies-env /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=build-env /app/dist ./dist
COPY --chown=appuser:appgroup --from=build-env /app/src ./src
COPY --chown=appuser:appgroup --from=build-env /app/prisma ./prisma
COPY --chown=appuser:appgroup package.json ./

ENV NODE_ENV=production
ENV SERVER_PORT=3333
ENV HOST=0.0.0.0
EXPOSE 3333

USER appuser

CMD ["node_modules/.bin/tsx", "src/server/index.ts"]
