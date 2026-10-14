# Architecture

Monorepo: `server/` (Express + Prisma + PostgreSQL) and `web/` (React + Vite). Multi-tenant (organizations, invites, roles), per-org Stripe billing, cookie auth, admin/RBAC, API keys, audit logs, Docker-first.

## Layer chain

Every HTTP request follows `Route → Controller → Service → Repository (interface) → Implementation`. No skipping.

- **Route**: path + middleware stacking + controller instantiation. Public routes before `authMiddleware`, protected after. `/api/*` uses `apiKeyMiddleware` + `requireApiScopes`.
- **Controller**: parse `req.body/params/query` → call service → `res.status().json()`. No logic, no logging (Morgan handles HTTP logs).
- **Service**: Zod validation + business logic + `logger.info` entry/exit + `logger.error` rethrow. No `req/res`. Constructor DI only.
- **Repository interface**: contract in `types/repositories/`. Implementation in `repositories/{prisma,bcrypt}/`, wired in `repositories/index.ts`.
- **Adapter**: external integrations (`stripe`, `resend`, `s3`, `oauth`) in `adapters/`, wired in `adapters/index.ts`.

## Auth

HttpOnly cookies (`accessToken` 15m, `refreshToken` 7d, `SameSite=Lax`, `Secure` in prod). Tokens are type-tagged (`access`/`refresh`) and each endpoint enforces its type, so a refresh token cannot be replayed as an access token. `req.user` set by `authMiddleware` (rejects `active=false` and pre-`passwordChangedAt` tokens). Bcrypt-12 via `IPasswordHasher`. Generic `Invalid credentials.` everywhere. Refresh rotation with `jti` family — reuse revokes the whole family. Rate-limit on register/login/refresh/reset/oauth + per-account lockout that also counts MFA failures. `REQUIRE_VERIFIED_EMAIL` gates billing/invites/api-keys/uploads. MFA TOTP + backup codes. `POST /auth/reset/confirm { token, password }` completes the reset started at `/reset-password?token=`.

## Multi-tenant + RBAC

`Organization.active` soft-delete (`remove()` sets `active=false`, `listForUser` filters, `requireOrgRole` + `apiKeyMiddleware` reject inactive). Membership roles `owner/admin/member`. `requireOrgRole(...roles)` checks membership + active org. Page RBAC: `requirePage(pageKey)` via `permissionRepository.resolve()` — admin bypass, `configured:false` blocks, empty `allowedPages` = open (legacy). `requireAdmin` checks `type=admin`. Frontend `PrivateRoute` (auth) + `PageRoute` (UX-only, backend re-enforces) + `NAV_ITEMS` with `labelKey` for i18n.

## Billing + API keys

`PLANS` in `stripe-billing-adapter.ts` is the single source (exposed via public `GET /billing/plans`). Webhook: raw body via `express.json({ verify })`, signature check, idempotency via `webhook_events.claim()`, resolve org `metadata → customer → subscription`, never 500, prod refuses mocks and missing keys (`Billing not configured.`). Trial 14d Starter on org create. Gates via `requirePlan` (402). API keys: `x-api-key: <prefix>.<secret>`, sha256 stored, scopes (`members:read`, `audit:read`, `usage:write`, `billing:read`), org-bound, `touch()` updates `lastUsedAt`.

## Frontend

Pages in `pages/dashboard/{page}/index.tsx + index.module.css`, components in `components/{name}/`. API client `services/api.ts` uses `credentials:"include"`, single-flight refresh, 401 → `unauthorized` event → logout. No tokens in `localStorage`. Mobile-first CSS (base phone + `min-width`), tokens from `global.css`, 44px touch, `DataTable responsive="cards"|"scroll"`, i18n via `STRINGS` (`en` + `pt-BR`).

## Docker + prod

`docker-compose.yml` (base) + `override` (dev hot reload, anonymous `node_modules`, `CHOKIDAR_USEPOLLING=1`) + `prod` (Traefik TLS, tuned Postgres, daily `db-backup`, named `server-generated` volume). `VITE_API_URL` is build-time. `entrypoint.sh` builds `DATABASE_URL`, runs `migrate deploy`, drops to `appuser`. CI: `tsc` both, Jest, `audit-gate`, Trivy blocking HIGH/CRITICAL, SCP+SSH deploy writing `.env` then deleting it.
