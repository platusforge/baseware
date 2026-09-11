# Deployment

## Development

```sh
docker compose up --build
```

## Production (Traefik + TLS)

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

- `:443` serves web + `/api/*` (TLS via Let's Encrypt). All auth traffic goes here.
- `:3001` serves the API directly (IP-whitelisted non-auth traffic only — never login/refresh).
- `VITE_API_URL=/api` in prod (baked at build time via `args`).
- DB backups run daily (`db-backup`, 7-day retention).

## CI/CD

Push to `master` → GH Action copies files via SCP, writes `.env` from secrets (single-quoted `printf`), runs prod compose, deletes `.env`. Required secrets: `HOST, USERNAME, PRIVATE_KEY, SSH_PORT, DB_*, DATABASE_URL, JWT_SECRET, STRIPE_*, SMTP_*, ADMIN_EMAIL`.
