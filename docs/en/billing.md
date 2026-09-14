# Billing (Stripe, per-organization)

The `Organization` owns billing. `Subscription` tracks plan/status/seats/period end.

## Flow

1. Frontend: `POST /billing/checkout { organizationId, plan }` → redirect to `url`. The Stripe customer is created once per org and reused (no duplicates).
2. Stripe: `checkout.session.completed` / `customer.subscription.*` / `invoice.payment_failed` → `POST /billing/webhook`.
3. `HandleBillingWebhookService` resolves the org (checkout metadata → Stripe customer → subscription record), syncs plan/status, notifies owners on payment failure, and appends an audit log.
4. Frontend: `GET /billing/status?orgId=` renders plan; `POST /billing/portal` opens the Customer Portal.

## Webhook hardening (market standard)

| Concern | How |
|---|---|
| Raw body | `express.json({ verify })` in `app.ts` captures `req.rawBody` for signature verification — no path sniffing |
| Fail closed | Missing/invalid `stripe-signature` → 400 (Stripe retries). Without `STRIPE_WEBHOOK_SECRET`, only explicitly flagged mock payloads (`{"mock": true, ...}`) are accepted in dev; **production never accepts mocks** |
| Idempotency | Every `event.id` is claimed once in `webhook_events`; Stripe retries return `{ received: true, duplicate: true }` without mutating state |
| Never 500 | The route only returns 200/400 so retries behave predictably |
| Prod guard | `CreateCheckoutService`/`CreatePortalService` and the adapter throw `Billing not configured.` when `STRIPE_SECRET_KEY` is empty in production — no silent mock sales |

Event matrix:

| Event | Effect |
|---|---|
| `checkout.session.completed` | Enriches via Subscription API, upserts subscription, sets org plan |
| `customer.subscription.created/updated` | Upserts subscription, sets org plan (`priceToPlan`) |
| `customer.subscription.deleted` | Status `canceled`, org plan back to `free` |
| `invoice.payment_failed` | Status `past_due` + in-app notification + email to owners/admins |
| `invoice.payment_succeeded` | Recovery path: re-syncs status/plan (closes the dunning loop) |
| anything else | Audit log only |

Unknown Stripe statuses are audited and skipped (never throw, so no retry loop); unknown price ids keep the current plan instead of silently downgrading. Only owners/admins can open checkout/portal (`requireOrgRole`); invites respect plan seat limits (free 1, starter 5, pro 25).

## Plan gates + trial + invoices

New orgs get a 14-day Starter trial (`TRIAL_DAYS`, `trialEndsAt`, `status=trialing`). Billing page shows the trial banner and `GET /billing/invoices` lists the last 12 Stripe invoices (empty in mock mode).

Feature gates (`requirePlan`, 402 on block): `api-keys` and `uploads` need Starter+, `audit` needs Pro. Frontend redirects 402 to billing. Metered usage: `POST /usage/events { organizationId, metric, quantity }` (member+, validated `metric/quantity`).

## Local development with `stripe listen`

```sh
stripe login
stripe listen --forward-to localhost:3000/billing/webhook
# in another terminal, trigger fixtures:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

Copy the `whsec_...` secret printed by `listen` into `STRIPE_WEBHOOK_SECRET` and restart `docker compose up`.

## Adding a plan

1. Create the Price in Stripe.
2. Add `STRIPE_PRICE_X` to `.env.example`, `server/src/env.ts`, CI secrets.
3. Add entry to `PLANS` in `stripe-billing-adapter.ts` (`priceToPlan` maps price → plan automatically).
4. `GET /billing/plans` (public, no auth) exposes the public plan list — `PricingTable` fetches it and falls back to a local copy offline.

Without `STRIPE_SECRET_KEY`, checkout/portal return deterministic mock URLs in dev only so local dev never breaks. In production they throw `Billing not configured.`.

## API keys (machine-to-machine)

Create via `POST /api-keys { name, organizationId?, scopes[], expiresAt? }` (owner/admin for org keys, Starter+ for `api-keys` feature). Only the hash is stored; the raw `sk_....` is shown once.

Use via `x-api-key: <prefix>.<secret>` on `/api/*` (no cookies):

| Endpoint | Scope |
|---|---|
| `GET /api/organizations/:orgId/members` | `members:read` |
| `GET /api/organizations/:orgId/audit` | `audit:read` |
| `POST /api/usage/events` | `usage:write` |
| `GET /api/billing/status` | `billing:read` |
| `GET /api/billing/invoices` | `billing:read` |

Keys are bound to one organization — cross-org reads return 400. `lastUsedAt` is updated via `apiKeyRepository.touch()` on every call. Revoke via `DELETE /api-keys/:id`.
