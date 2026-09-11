# Customization

## New CRUD entity (org-scoped "Project")

1. Prisma model + `migrate dev` + `generate`.
2. Interface `types/repositories/project-repository.ts` → `repositories/prisma/prisma-project-repository.ts` → export in `repositories/index.ts`.
3. Services `services/project-service/*.ts` (Zod + logs), controller, `routes/project-routes.ts` with `requireOrgRole()`, mount after `authMiddleware`.
4. Jest test per service (mock `@/logger`, inject mocked repos).
5. Frontend `pages/dashboard/projects/` + `NAV_ITEMS` + i18n keys.

## Theming / i18n

- Theme: CSS variables in `web/src/styles/global.css` (`--color-primary`, …), `data-theme="light"` override.
- Languages: `web/src/contexts/i18n-context.tsx` (`STRINGS`); add keys in both `en` and `pt-BR`.

## Email / storage / analytics

- Email: `adapters/resend/` (Resend HTTP API). Templates inline in services.
- Uploads: `POST /uploads/url` returns a presigned-style URL via `S3StorageAdapter`.
- Analytics/errors: set `POSTHOG_KEY` / `SENTRY_DSN` — clients read the `VITE_*` twins.
