# Orchestrator-only Dockerfile for Cloud Run
FROM node:20-alpine AS base
RUN npm install -g pnpm@9.14.2

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/orchestrator/package.json ./apps/orchestrator/
COPY libraries/nestjs-libraries/package.json ./libraries/nestjs-libraries/
COPY libraries/react-shared-libraries/package.json ./libraries/react-shared-libraries/
RUN pnpm install --frozen-lockfile

# Build orchestrator
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run prisma-generate
RUN pnpm exec nx build orchestrator --prod

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built orchestrator
COPY --from=builder /app/dist/apps/orchestrator ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libraries/nestjs-libraries/src/database/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/package.json ./

# Cloud Run uses PORT env var (but orchestrator doesn't need HTTP)
ENV PORT=8080
EXPOSE 8080

# Start orchestrator worker
CMD ["node", "--experimental-require-module", "./dist/apps/orchestrator/src/main.js"]
