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
| Fail closed | Assinatura ausente/inválida → 400 (Stripe tenta de novo). Sem `STRIPE_WEBHOOK_SECRET`, só payloads mock explícitos (`{"mock": true, ...}`) são aceitos |
| Idempotência | Cada `event.id` é reivindicado uma vez em `webhook_events`; retries retornam `{ received: true, duplicate: true }` sem mutar estado |
| Nunca 500 | A rota só retorna 200/400 para retries previsíveis |

Matriz de eventos:

| Evento | Efeito |
|---|---|
| `checkout.session.completed` | Enriquece via API de Subscription, upsert, define plano da org |
| `customer.subscription.created/updated` | Upsert da subscription, define plano (`priceToPlan`) |
| `customer.subscription.deleted` | Status `canceled`, plano da org volta para `free` |
| `invoice.payment_failed` | Status `past_due` + notificação in-app + email para owners/admins |
| qualquer outro | Só audit log |

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
4. Adicione o card em `web/src/components/pricing-table/`.

Sem `STRIPE_SECRET_KEY`, checkout/portal retornam URLs mock determinísticas — o dev local nunca quebra.
