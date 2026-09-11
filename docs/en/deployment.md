# Deployment

## Development

```sh
docker compose up --build
```

## Production (Traefik + TLS)

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

- `:443` serves web + `/api/*` (TLS via Let's Encrypt, HSTS enabled). All public traffic goes here.
- `:3001` serves the API directly over plain HTTP and is restricted to private ranges by a Traefik `ipallowlist` middleware — never expose it publicly, never send credentials to it.
- `VITE_API_URL=/api` in prod (baked at build time via `args`).
- DB backups run daily (`db-backup`, 7-day retention).
- After first boot, change the seeded admin password (`db:seed` uses a documented default) and rotate `JWT_SECRET` (production refuses to boot with the public placeholder).

## CI/CD

Push to `master` → GH Action copies files via SCP, writes `.env` from secrets (single-quoted `printf`), runs prod compose, deletes `.env`. Required secrets: `HOST, USERNAME, PRIVATE_KEY, SSH_PORT, DB_*, DATABASE_URL, JWT_SECRET, STRIPE_*, GOOGLE_*, GITHUB_*, API_PUBLIC_URL, FRONTEND_URL, RESEND_API_KEY, SENTRY_DSN, POSTHOG_KEY, ADMIN_EMAIL`.
