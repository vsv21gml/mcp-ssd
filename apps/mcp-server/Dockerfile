FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/mcp-server/package.json apps/mcp-server/package.json
RUN npm ci --workspaces --include-workspace-root

FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/mcp-server apps/mcp-server
RUN npm run -w mcp-server build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/mcp-server/dist /app/apps/mcp-server/dist
COPY --from=builder /app/apps/mcp-server/package.json /app/apps/mcp-server/package.json
CMD ["node", "apps/mcp-server/dist/main.js"]
