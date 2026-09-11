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
| Fail closed | Missing/invalid `stripe-signature` → 400 (Stripe retries). Without `STRIPE_WEBHOOK_SECRET`, only explicitly flagged mock payloads (`{"mock": true, ...}`) are accepted |
| Idempotency | Every `event.id` is claimed once in `webhook_events`; Stripe retries return `{ received: true, duplicate: true }` without mutating state |
| Never 500 | The route only returns 200/400 so retries behave predictably |

Event matrix:

| Event | Effect |
|---|---|
| `checkout.session.completed` | Enriches via Subscription API, upserts subscription, sets org plan |
| `customer.subscription.created/updated` | Upserts subscription, sets org plan (`priceToPlan`) |
| `customer.subscription.deleted` | Status `canceled`, org plan back to `free` |
| `invoice.payment_failed` | Status `past_due` + in-app notification + email to owners/admins |
| anything else | Audit log only |

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
4. Add card in `web/src/components/pricing-table/`.

Without `STRIPE_SECRET_KEY`, checkout/portal return deterministic mock URLs so local dev never breaks.
