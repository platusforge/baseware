# Getting started

## Prerequisites

Docker Engine 24+, Git, a Stripe account (optional for local dev — mock mode works without keys).

## Setup

```sh
cp .env.example .env
# Required: JWT_SECRET (>= 32 chars), DB_PASSWORD
docker compose up --build
docker compose exec server npx prisma migrate dev
docker compose exec server npm run db:seed
```

Open `http://localhost:5173` and log in with `admin@example.com / Change-me-123!`.

## First 10 minutes

1. Change the brand color in `web/src/styles/global.css` (`--color-primary`).
2. Edit landing copy in `web/src/pages/landing/index.tsx`.
3. Rename plans in `server/src/adapters/stripe/stripe-billing-adapter.ts` (`PLANS`).
4. Create your first org in Settings, invite a teammate, upgrade via Stripe test mode.

## Environment matrix

See `.env.example`. Server validates everything with Zod in `server/src/env.ts` and exits(1) on missing vars. Frontend build-time vars (`VITE_*`) require `docker compose build` after changes.
