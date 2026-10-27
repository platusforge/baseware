# DevKit

[![Patrocinar o DevKit](https://img.shields.io/badge/Patrocinar-DevKit-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/ClaudioBzrr)

Starter SaaS pronto para produção: **Express + React (Vite) + PostgreSQL**, com tudo que os boilerplates pagos ($199–$349) entregam — e nada do que eles omitem para B2B.

> 🇺🇸 English? Read [README.md](./README.md).
> 🤖 Vai construir com agente de IA? Leia [AGENTS.md](./AGENTS.md) primeiro — é o manual oficial de construção.

## Por que este boilerplate

| O que os pagos fazem | Este boilerplate |
|---|---|
| Auth (email + OAuth) | ✅ Email/senha + OAuth Google/GitHub (state + PKCE, vínculo por email verificado) |
| Organizações / times / convites / RBAC | ✅ Multi-tenancy first-class, billing por organização |
| Assinaturas Stripe + portal + webhooks | ✅ Checkout, portal, webhooks robustos (verificação fail-closed, idempotência, dunning) |
| Landing + preços + FAQ + blog | ✅ Landing, tabela de preços, FAQ, blog em arquivos, meta SEO/OG |
| Painel admin, audit logs, API keys | ✅ Os três incluídos |
| Email transacional | ✅ Adapter Resend (HTTP API, sem CVEs de SMTP) |
| Docker + CI/CD | ✅ Compose em 3 arquivos, Dockerfiles multi-stage, Traefik TLS, GH Actions |
| Testes + docs + regras de IA | ✅ Testes Jest, docs bilíngues, AGENTS.md |

## Stack

- **server**: Express 5, TypeScript strict, Prisma 7 (driver adapter), PostgreSQL 16, Zod 4, Winston + Morgan, Helmet, rate-limit, Stripe, Resend, node-cron.
- **web**: React 19, Vite 8, React Router 7, CSS Modules + variáveis CSS (dark/light), i18n EN + PT-BR.
- **infra**: Node 24, Docker Compose (base/override/prod), Nginx SPA + proxy `/api`, Traefik TLS, deploy via GH Actions.

## Início rápido (Docker — único caminho suportado)

```sh
cp .env.example .env   # defina JWT_SECRET (>=32 chars) + DB_PASSWORD
docker compose up --build
# web → http://localhost:5173 · api → http://localhost:3000/health
docker compose exec server npx prisma migrate dev
docker compose exec server npm run db:seed   # admin@example.com / Change-me-123!
```

Produção:

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

## Arquitetura (cadeia de 5 camadas)

```
Route → Controller → Service → Repository (interface) → Implementation
```

- Routes só têm paths + middlewares. Controllers fazem parse → call → respond (sem lógica, sem log). Services têm validação (Zod), regra de negócio e logs. Repositories têm acesso a dados atrás de interfaces. DI manual em `server/src/repositories/index.ts` e `server/src/adapters/index.ts`. `@/` aponta para `src/` nos dois lados. Arquivos sempre em kebab-case minúsculo. Commits em inglês, Conventional Commits.

Referência completa: [`docs/pt-BR/`](./docs/pt-BR/inicio-rapido.md) e [`docs/en/`](./docs/en/getting-started.md).

## Segurança de auth (obrigatória)

- Access 15min + refresh rotativo 7 dias em cookies `HttpOnly + Secure + SameSite`; tokens marcados por tipo (`access`/`refresh`), então um refresh nunca vale como access. Nunca `localStorage`.
- Erro genérico `Invalid credentials.` (sem enumeração), compare com dummy-hash, `active` + lockout (`failedLoginAttempts`/`lockedUntil` — falhas de senha e MFA), bcrypt custo 12.
- Rate-limit em `/login` (10/15min) e `/reset/*` (3/h), com Redis quando `REDIS_URL` definido.
- MFA TOTP (`/auth/mfa/*`, backup codes), sessões, `mustChangePassword` do seed. E-mail verificado exigido para checkout/convites/api-keys/uploads.
- Tokens de reset com hash SHA-256, uso único, 1h. Helmet + CORS allowlist + TLS em prod; a API nunca é publicada no host (sem entrypoint HTTP puro — Traefik `:443` → nginx `/api` → `server:3000` interno). Nunca logar segredos.

## Modelo de cobrança

- `Organization` é dona do customer Stripe + `Subscription` (plano, status, seats, período, trial de 14 dias).
- `POST /billing/checkout` → Checkout; `POST /billing/portal` → Portal; `GET /billing/invoices` → faturas; webhook verificado + idempotente.
- Gates retornam 402: `api-keys`/`uploads` exigem Starter+, `audit` exige Pro. Uso medido via `POST /usage/events`.
- `GET /auth/oauth/:provider` → login Google/GitHub. Modo mock sem `STRIPE_SECRET_KEY`.
- Planos em `stripe-billing-adapter.ts` (`PLANS`) espelhados no `pricing-table`.

## Estrutura

```
server/src/{routes,controllers,services,repositories,adapters,types,common,constants,lib}
web/src/{pages,dashboard,components,contexts,routes,services,styles,types}
docs/{en,pt-BR}/ · AGENTS.md · docker-compose*.yml · .github/workflows/ci.yml
```

## Scripts

| Comando | Para quê |
|---|---|
| `docker compose up` | Dev (hot reload nos dois apps) |
| `npm --workspace server test` | Testes unitários Jest |
| `npm --workspace server run db:seed` | Org demo + admin + roles |
| `docker compose exec server npx prisma migrate dev` | Nova migration |
| `docker compose exec server npx prisma generate` | Obrigatório após mudar schema |

## Documentação

- Português: [`inicio-rapido.md`](./docs/pt-BR/inicio-rapido.md) · [`billing.md`](./docs/pt-BR/billing.md) · [`auth.md`](./docs/pt-BR/auth.md) · [`deploy.md`](./docs/pt-BR/deploy.md) · [`customizacao.md`](./docs/pt-BR/customizacao.md)
- English: [`docs/en/`](./docs/en/getting-started.md)
- Agentes de IA: [`AGENTS.md`](./AGENTS.md) (leitura obrigatória antes de gerar features)

## Licença

Uso comercial permitido sob [`LICENSE.md`](./LICENSE.md) (tier single-project ou unlimited, conforme seu recibo). É proibido revender ou redistribuir o código-fonte do boilerplate.
