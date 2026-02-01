FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspaces --include-workspace-root

FROM deps AS builder
COPY apps/web apps/web
RUN npm run -w web build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/web/.next /app/apps/web/.next
COPY --from=builder /app/apps/web/package.json /app/apps/web/package.json
COPY --from=builder /app/apps/web/next.config.js /app/apps/web/next.config.js
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "--hostname", "0.0.0.0", "-c", "apps/web"]
