FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/account-server/package.json apps/account-server/package.json
RUN npm ci --workspaces --include-workspace-root

FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/account-server apps/account-server
RUN npm run -w account-server build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/account-server/dist /app/apps/account-server/dist
COPY --from=builder /app/apps/account-server/package.json /app/apps/account-server/package.json
CMD ["node", "apps/account-server/dist/main.js"]
