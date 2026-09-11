# Início rápido

## Pré-requisitos

Docker Engine 24+, Git, conta Stripe (opcional local — modo mock funciona sem chaves).

## Instalação

```sh
cp .env.example .env
# Obrigatório: JWT_SECRET (>= 32 chars), DB_PASSWORD
docker compose up --build
docker compose exec server npx prisma migrate dev
docker compose exec server npm run db:seed
```

Abra `http://localhost:5173` e entre com `admin@example.com / Change-me-123!`.

## Primeiros 10 minutos

1. Troque a cor da marca em `web/src/styles/global.css` (`--color-primary`).
2. Edite a landing em `web/src/pages/landing/index.tsx`.
3. Renomeie os planos em `server/src/adapters/stripe/stripe-billing-adapter.ts` (`PLANS`).
4. Crie sua primeira org em Settings, convide alguém, faça upgrade em modo teste do Stripe.

## Variáveis de ambiente

Ver `.env.example`. O server valida tudo com Zod em `server/src/env.ts` e sai com exit(1) se faltar algo. Vars `VITE_*` são build-time: após mudar, rode `docker compose build`.
