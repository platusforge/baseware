# Billing (Stripe, por organização)

A `Organization` é dona da cobrança. A `Subscription` guarda plano/status/seats/fim do período.

## Fluxo

1. Frontend: `POST /billing/checkout { organizationId, plan }` → redireciona para `url`. O customer Stripe é criado uma vez por org e reutilizado (sem duplicados).
2. Stripe: `checkout.session.completed` / `customer.subscription.*` / `invoice.payment_failed` → `POST /billing/webhook`.
3. `HandleBillingWebhookService` resolve a org (metadata do checkout → customer Stripe → registro de subscription), sincroniza plano/status, notifica owners em falha de pagamento e grava audit log.
4. Frontend: `GET /billing/status?orgId=` mostra o plano; `POST /billing/portal` abre o Portal do Cliente.

## Robustez do webhook (padrão de mercado)

| Ponto | Como |
|---|---|
| Raw body | `express.json({ verify })` no `app.ts` captura `req.rawBody` para verificação da assinatura — sem path sniffing |
| Fail closed | Assinatura ausente/inválida → 400 (Stripe tenta de novo). Sem `STRIPE_WEBHOOK_SECRET`, só payloads mock explícitos (`{"mock": true, ...}`) são aceitos em dev; **produção nunca aceita mock** |
| Idempotência | Cada `event.id` é reivindicado uma vez em `webhook_events`; retries retornam `{ received: true, duplicate: true }` sem mutar estado |
| Nunca 500 | A rota só retorna 200/400 para retries previsíveis |
| Guarda prod | `CreateCheckoutService`/`CreatePortalService` e o adapter lançam `Billing not configured.` quando `STRIPE_SECRET_KEY` vazio em produção — sem venda mock silenciosa |

Matriz de eventos:

| Evento | Efeito |
|---|---|
| `checkout.session.completed` | Enriquece via API de Subscription, upsert, define plano da org |
| `customer.subscription.created/updated` | Upsert da subscription, define plano (`priceToPlan`) |
| `customer.subscription.deleted` | Status `canceled`, plano da org volta para `free` |
| `invoice.payment_failed` | Status `past_due` + notificação in-app + email para owners/admins |
| `invoice.payment_succeeded` | Recuperação: ressincroniza status/plano (fecha o ciclo de cobrança) |
| qualquer outro | Só audit log |

Status desconhecidos do Stripe são auditados e ignorados (sem throw, sem loop de retry); prices desconhecidos mantêm o plano atual em vez de fazer downgrade silencioso. Só owners/admins abrem checkout/portal (`requireOrgRole`); convites respeitam o limite de seats do plano (free 1, starter 5, pro 25).

## Trial, faturas e gates de plano

Orgs novas ganham trial Starter de 14 dias (`TRIAL_DAYS`, `trialEndsAt`, `status=trialing`). A página de cobrança mostra o banner do trial e `GET /billing/invoices` lista as últimas 12 faturas do Stripe (vazio em mock).

Gates (`requirePlan`, 402 ao bloquear): `api-keys` e `uploads` exigem Starter+, `audit` exige Pro. Frontend redireciona 402 para cobrança. Uso medido: `POST /usage/events { organizationId, metric, quantity }` (membro+, com validação).

## Dev local com `stripe listen`

```sh
stripe login
stripe listen --forward-to localhost:3000/billing/webhook
# em outro terminal, dispare fixtures:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

Copie o segredo `whsec_...` impresso pelo `listen` para `STRIPE_WEBHOOK_SECRET` e reinicie o `docker compose up`.

## Adicionar um plano

1. Crie o Price no Stripe.
2. Adicione `STRIPE_PRICE_X` em `.env.example`, `server/src/env.ts`, secrets do CI.
3. Adicione entrada em `PLANS` (`stripe-billing-adapter.ts`; `priceToPlan` mapeia preço→plano automaticamente).
4. `GET /billing/plans` (público, sem auth) expõe a lista — o `PricingTable` busca dela com fallback local.

Sem `STRIPE_SECRET_KEY`, checkout/portal retornam URLs mock só em dev. Em produção lançam `Billing not configured.`.

## API keys (machine-to-machine)

Crie via `POST /api-keys { name, organizationId?, scopes[], expiresAt? }` (owner/admin para chaves org, Starter+ para `api-keys`). Só o hash é guardado; o `sk_...` aparece uma vez.

Use via `x-api-key: <prefix>.<secret>` em `/api/*` (sem cookies):

| Endpoint | Scope |
|---|---|
| `GET /api/organizations/:orgId/members` | `members:read` |
| `GET /api/organizations/:orgId/audit` | `audit:read` |
| `POST /api/usage/events` | `usage:write` |
| `GET /api/billing/status` | `billing:read` |
| `GET /api/billing/invoices` | `billing:read` |

Chaves são vinculadas a uma org — leitura cross-org retorna 400. `lastUsedAt` via `touch()` a cada uso. Revogue com `DELETE /api-keys/:id`.
