FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/gateway/package.json ./services/gateway/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/content/package.json ./packages/content/
COPY packages/ai-prompts/package.json ./packages/ai-prompts/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @yikes/gateway build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/gateway/package.json ./services/gateway/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/content/package.json ./packages/content/
COPY packages/ai-prompts/package.json ./packages/ai-prompts/
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/services/gateway/dist ./services/gateway/dist
COPY --from=builder /app/services/gateway/package.json ./services/gateway/
EXPOSE 3000
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 http://localhost:3000/health || exit 1
CMD ["pnpm", "--filter", "@yikes/gateway", "start"]
