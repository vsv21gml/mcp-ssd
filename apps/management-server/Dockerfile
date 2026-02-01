FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/management-server/package.json apps/management-server/package.json
RUN npm ci --workspaces --include-workspace-root

FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/management-server apps/management-server
RUN npm run -w management-server build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/management-server/dist /app/apps/management-server/dist
COPY --from=builder /app/apps/management-server/package.json /app/apps/management-server/package.json
RUN mkdir -p /app/storage
CMD ["node", "apps/management-server/dist/main.js"]
