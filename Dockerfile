FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Copy workspace definition and dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Copy full repository source
COPY . .

# Build both React 19 Frontend and Fastify Backend
RUN pnpm build:frontend && pnpm build:backend

# ----------------------------------------------------
# Production Runner
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0

RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY backend/package.json ./backend/

# Install production dependencies only for backend
RUN pnpm install --prod --no-frozen-lockfile --filter ./backend

# Copy built artifacts from builder stage
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./backend/public
COPY --from=builder /app/samples ./samples

EXPOSE 10000

CMD ["node", "backend/dist/index.js"]
