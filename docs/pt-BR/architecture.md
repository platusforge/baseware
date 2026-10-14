# Arquitetura

Monorepo: `server/` (Express + Prisma + PostgreSQL) e `web/` (React + Vite). Multi-tenant (organizações, convites, papéis), billing Stripe por org, auth via cookie, admin/RBAC, API keys, audit logs, Docker-first.

## Cadeia de camadas

Todo HTTP segue `Route → Controller → Service → Repository (interface) → Implementation`. Sem pular.

- **Route**: path + middlewares + instanciação do controller. Públicas antes do `authMiddleware`, protegidas depois. `/api/*` usa `apiKeyMiddleware` + `requireApiScopes`.
- **Controller**: parse `req.body/params/query` → chama service → `res.status().json()`. Sem lógica, sem log (Morgan cuida).
- **Service**: validação Zod + regra de negócio + `logger.info` entrada/saída + `logger.error` relança. Sem `req/res`. DI por construtor.
- **Repository**: contrato em `types/repositories/`, impl em `repositories/{prisma,bcrypt}/`, fiação em `repositories/index.ts`.
- **Adapter**: integrações externas (`stripe`, `resend`, `s3`, `oauth`) em `adapters/`.

## Auth

Cookies HttpOnly (`accessToken` 15m, `refreshToken` 7d, `SameSite=Lax`, `Secure` em prod). Tokens carregam tipo (`access`/`refresh`) e cada endpoint exige o tipo correto, então um refresh token não vale como access token. `req.user` via `authMiddleware` (rejeita `active=false` e tokens pré-`passwordChangedAt`). Bcrypt-12 via `IPasswordHasher`. `Invalid credentials.` genérico sempre. Refresh com família `jti` — reuso revoga a família. Rate-limit em register/login/refresh/reset/oauth + lockout por conta que também conta falhas de MFA. `REQUIRE_VERIFIED_EMAIL` bloqueia billing/convites/api-keys/uploads. MFA TOTP + backup codes. `POST /auth/reset/confirm { token, password }` conclui o reset iniciado em `/reset-password?token=`.

## Multi-tenant + RBAC

`Organization.active` soft-delete (`remove()` marca `active=false`, `listForUser` filtra, `requireOrgRole` + `apiKeyMiddleware` rejeitam inativas). Papéis `owner/admin/member`. `requireOrgRole(...roles)` checa membership + org ativa. RBAC de página: `requirePage(pageKey)` via `permissionRepository` — admin bypass, `configured:false` bloqueia, `allowedPages` vazio = aberto (legado). Frontend `PrivateRoute` + `PageRoute` (só UX, backend reforça) + `NAV_ITEMS` com `labelKey` para i18n.

## Billing + API keys

`PLANS` em `stripe-billing-adapter.ts` é fonte única (exposta em `GET /billing/plans` público). Webhook: raw body via `express.json({ verify })`, assinatura, idempotência via `webhook_events`, resolve org `metadata → customer → subscription`, nunca 500, prod recusa mocks e chaves ausentes (`Billing not configured.`). Trial Starter 14d ao criar org. Gates via `requirePlan` (402). API keys: `x-api-key: <prefix>.<secret>`, sha256 guardado, scopes (`members:read`, `audit:read`, `usage:write`, `billing:read`), vinculadas à org, `touch()` atualiza `lastUsedAt`.

## Frontend

Páginas em `pages/dashboard/{page}/index.tsx + index.module.css`, componentes em `components/{name}/`. Client `services/api.ts` usa `credentials:"include"`, refresh single-flight, 401 → evento `unauthorized` → logout. Sem tokens em `localStorage`. CSS mobile-first (base phone + `min-width`), tokens de `global.css`, 44px touch, `DataTable responsive`, i18n via `STRINGS` (`en` + `pt-BR`).

## Docker + prod

`docker-compose.yml` (base) + `override` (hot reload dev, `node_modules` anônimo, `CHOKIDAR_USEPOLLING=1`) + `prod` (Traefik TLS, Postgres tunado, `db-backup` diário, volume nomeado `server-generated`). `VITE_API_URL` é build-time. `entrypoint.sh` monta `DATABASE_URL`, roda `migrate deploy`, cai para `appuser`. CI: `tsc` ambos, Jest, `audit-gate`, Trivy bloqueante HIGH/CRITICAL, deploy SCP+SSH escrevendo `.env` e apagando depois.
