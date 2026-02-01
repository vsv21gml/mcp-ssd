# Repository Guidelines

## Project Structure & Module Organization
- `apps/account-server`: NestJS SSO (SAML/OIDC) + OAuth 2.1 Authorization Server.
- `apps/management-server`: NestJS file upload/approvals/env/roles API.
- `apps/mcp-server`: MCP Streamable HTTP server (`/mcp`) for ChatGPT Apps.
- `apps/web`: Next.js end‑user UI (Mantine + Zustand).
- `apps/admin-web`: Next.js admin UI (clients/users).
- `packages/shared`: Shared types used by servers and MCP.

## Build, Test, and Development Commands
- `npm run dev`: Run all apps in parallel via Turbo.
- `npm run build`: Build all workspaces.
- `npm run lint`: Run lint scripts (Next.js lint for web/admin-web; others are no-op).
- `npm run typecheck`: TypeScript type checks in each app.
- Individual apps: `apps/*/package.json` has `dev`, `build`, `start`, `typecheck`.

## Coding Style & Naming Conventions
- TypeScript across servers and UIs.
- Indentation: 2 spaces (existing files follow this).
- React components use PascalCase; hooks and stores use camelCase.
- API routes in Next.js live under `apps/*/app/api/...`.
- Formatting: no enforced formatter in repo; keep changes consistent with existing style.

## Testing Guidelines
- No test framework configured yet.
- If you add tests, keep them close to the module (e.g., `apps/management-server/test/...`) and document the command you add.

## Commit & Pull Request Guidelines
- No explicit commit message convention found in the repository.
- PRs should include: purpose, affected apps, and any UI screenshots (web/admin-web).
- For backend changes, include API endpoint changes and env updates.

## Security & Configuration Tips
- Use app‑specific `.env` files (see `apps/*/.env.example`).
- Ingress exposes only `web`, `admin-web`, `mcp-server`. Account/management run behind prefixes:
  - Account: `/oauth` (OIDC issuer at `/oauth/oidc`)
  - Management: `/api`
- Update `ACCOUNT_ISSUER` and `MGMT_BASE_URL` consistently across services.
