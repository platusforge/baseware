# Customização

## Nova entidade CRUD (ex. "Project" por org)

1. Model Prisma + `migrate dev` + `generate`.
2. Interface `types/repositories/project-repository.ts` → `repositories/prisma/prisma-project-repository.ts` → exportar em `repositories/index.ts`.
3. Services `services/project-service/*.ts` (Zod + logs), controller, `routes/project-routes.ts` com `requireOrgRole()`, montar após `authMiddleware`.
4. Teste Jest por service (mock `@/logger`, repos mockados via construtor).
5. Frontend `pages/dashboard/projects/` + `NAV_ITEMS` + chaves i18n.

## Tema / i18n

- Tema: variáveis CSS em `web/src/styles/global.css` (`--color-primary`, …), override com `data-theme="light"`.
- Idiomas: `web/src/contexts/i18n-context.tsx` (`STRINGS`); adicione chaves em `en` e `pt-BR`.

## Email / storage / analytics

- Email: `adapters/resend/` (HTTP API do Resend). Templates inline nos services.
- Uploads: `POST /uploads/url` retorna URL pré-assinada via `S3StorageAdapter`.
- Analytics/erros: defina `POSTHOG_KEY` / `SENTRY_DSN` — o front lê as gêmeas `VITE_*`.
