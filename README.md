# SaaS Boilerplate

Production-ready SaaS starter: **Express + React (Vite) + PostgreSQL**, fully **Open Architecture** compliant, with everything paid boilerplates ($199–$349) ship — and nothing they omit for B2B.

> 🇧🇷 Fala português? Leia [README.pt-BR.md](./README.pt-BR.md).
> 🤖 Building with an AI agent? Read [AGENTS.md](./AGENTS.md) first — it is the exclusive build manual.

## Why this boilerplate

| Paid kits do | This boilerplate |
|---|---|
| Auth (email + OAuth) | ✅ Email/password + Google/GitHub OAuth (state + PKCE, verified-email linking) |
| Organizations / teams / invites / RBAC | ✅ First-class multi-tenancy, per-org billing |
| Stripe subscriptions + portal + webhooks | ✅ Checkout, portal, hardened webhooks (fail-closed verify, idempotency, dunning) |
| Landing + pricing + FAQ + blog | ✅ Landing, pricing table, FAQ, file-based blog, OG/SEO meta |
| Admin panel, audit logs, API keys | ✅ All three included |
| Transactional email | ✅ Resend adapter (HTTP API, no SMTP CVEs) |
| Docker + CI/CD | ✅ 3-file Compose, multi-stage Dockerfiles, Traefik TLS, GH Actions |
| Tests + docs + AI rules | ✅ Jest unit tests, bilingual docs, AGENTS.md |

## Stack

- **server**: Express 4, TypeScript strict, Prisma 6, PostgreSQL 16, Zod, Winston + Morgan, Helmet, express-rate-limit, Stripe, Resend, node-cron.
- **web**: React 18, Vite 5, React Router 6, CSS Modules + CSS variables (dark/light), EN + PT-BR i18n.
- **infra**: Docker Compose (base/override/prod), Nginx SPA + `/api` proxy, Traefik TLS, GH Actions push-to-deploy.

## Quickstart (Docker — the only supported path)

```sh
cp .env.example .env   # then set JWT_SECRET (>=32 chars) + DB_PASSWORD
docker compose up --build
# web → http://localhost:5173 · api → http://localhost:3000/health
docker compose exec server npx prisma migrate dev
docker compose exec server npm run db:seed   # admin@example.com / Change-me-123!
```

Production:

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

## Architecture (5-layer chain)

```
Route → Controller → Service → Repository (interface) → Implementation
```

- Routes own paths + middleware stacking only. Controllers parse → call → respond (no logic, no logging). Services own validation (Zod), business logic, logging. Repositories own data access behind interfaces. DI is manual in `server/src/repositories/index.ts` and `server/src/adapters/index.ts`. `@/` maps to `src/` on both sides. All filenames lowercase kebab-case. Commits in English, Conventional Commits.

Full reference: [`docs/en/`](./docs/en/getting-started.md), [`docs/pt-BR/`](./docs/pt-BR/inicio-rapido.md), and the Open Architecture docs this project follows.

## Auth security (enforced)

- 15-min access + rotating 7-day refresh in `HttpOnly + Secure + SameSite` cookies. Never `localStorage`.
- Generic `Invalid credentials.` (no enumeration), dummy-hash compare, `active` + lockout (`failedLoginAttempts`/`lockedUntil`), bcrypt cost 12.
- Rate-limited `/login` (10/15min) and `/reset/*` (3/h), Redis-backed when `REDIS_URL` is set (multi-replica), in-memory otherwise.
- TOTP MFA (`/auth/mfa/*`, backup codes SHA-256), sessions list/revoke, `mustChangePassword` seed enforcement.
- Email verification enforced for checkout/invites/api-keys/uploads (`REQUIRE_VERIFIED_EMAIL`). Password reset tokens SHA-256 hashed, single-use, 1h expiry.
- Helmet + CORS allowlist + TLS-only public traffic in prod (port `:3001` is restricted to private ranges via Traefik allowlist — never expose it publicly). Secrets never logged; OAuth codes are redacted from HTTP logs.

## Billing model

- `Organization` owns the Stripe customer + `Subscription` (plan, status, seats, period end, trial).
- New orgs get a 14-day Starter trial (`TRIAL_DAYS`). `POST /billing/checkout` → Stripe Checkout; `POST /billing/portal` → Customer Portal; `GET /billing/invoices` → last 12 invoices; `POST /billing/webhook` (verified + idempotent) → status sync + dunning + audit log.
- Plan gates return 402: `api-keys`/`uploads` need Starter+, `audit` needs Pro. Metered usage via `POST /usage/events`.
- `GET /auth/oauth/:provider` → Google/GitHub login (auto-links verified emails, provisions a workspace on signup).
- Graceful mock mode when `STRIPE_SECRET_KEY` is empty (local dev without Stripe).
- Plans centralized in `server/src/adapters/stripe/stripe-billing-adapter.ts` (`PLANS`) and mirrored in `web/src/components/pricing-table/`.

## Project structure

```
server/src/{routes,controllers,services,repositories,adapters,types,common,constants,lib}
web/src/{pages,dashboard,components,contexts,routes,services,styles,types}
docs/{en,pt-BR}/ · AGENTS.md · docker-compose*.yml · .github/workflows/ci.yml
```

## Scripts

| Command | What |
|---|---|
| `docker compose up` | Dev (hot reload both apps) |
| `npm --workspace server test` | Jest unit tests |
| `npm --workspace server run db:seed` | Demo org + admin + roles |
| `docker compose exec server npx prisma migrate dev` | New migration |
| `docker compose exec server npx prisma generate` | Mandatory after schema change |

## Docs

- English: [`docs/en/getting-started.md`](./docs/en/getting-started.md) · [`billing.md`](./docs/en/billing.md) · [`auth.md`](./docs/en/auth.md) · [`deployment.md`](./docs/en/deployment.md) · [`customization.md`](./docs/en/customization.md)
- Português: [`docs/pt-BR/`](./docs/pt-BR/inicio-rapido.md)
- AI agents: [`AGENTS.md`](./AGENTS.md) (mandatory reading before generating features)

## License

Commercial use allowed under [`LICENSE.md`](./LICENSE.md) (single-project or unlimited tier, per your receipt). You may NOT resell or redistribute the boilerplate source itself.
