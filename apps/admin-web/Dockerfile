FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/admin-web/package.json apps/admin-web/package.json
RUN npm ci --workspaces --include-workspace-root

FROM deps AS builder
COPY apps/admin-web apps/admin-web
RUN npm run -w admin-web build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/admin-web/.next /app/apps/admin-web/.next
COPY --from=builder /app/apps/admin-web/package.json /app/apps/admin-web/package.json
COPY --from=builder /app/apps/admin-web/next.config.js /app/apps/admin-web/next.config.js
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001", "--hostname", "0.0.0.0", "-c", "apps/admin-web"]
