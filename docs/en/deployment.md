# Deployment

## Development

```sh
docker compose up --build
```

With Redis rate-limits (optional): `REDIS_URL=redis://localhost:6379 docker compose --profile with-redis up` (prod compose ships a `redis` profile).

## Production (Traefik + TLS)

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
# with distributed rate-limits:
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile with-redis --env-file .env up -d --build
```

- `:443` serves web + `/api/*` (TLS via Let's Encrypt, HSTS enabled). All public traffic goes here. Web Host comes from `APP_HOST` (no more hardcoded domain).
- The API is not published on the host: Traefik exposes only `:80`/`:443`, and nginx proxies `/api/*` to `server:3000` over the internal Docker network. There is no plain-HTTP API entrypoint.
- `VITE_API_URL=/api` in prod (baked at build time via `args`; changing `VITE_*` requires `docker compose build`, not just `up`).
- DB backups run daily (`db-backup`, 7 daily + 4 weekly + 6 monthly). Offsite: sync `/backups` to S3 (`aws s3 sync`) — see runbook below.
- Healthchecks: `db` (pg_isready), `server` (`/health`), `web` (nginx `/`), `redis` (ping, profile only).
- After first boot, change the seeded admin password (`db:seed` sets `mustChangePassword=true`, dashboard blocks until changed) and rotate `JWT_SECRET` (production refuses to boot with the public placeholder).
- Observability: prod warns at boot when `SENTRY_DSN` is empty or PostHog consent is denied. Rate-limits warn when `REDIS_URL` is empty (single-replica mode).

## Renaming from DevKit

Compose prefixes every volume with the project name, so a rename boots against an empty database unless the volumes are copied:

```sh
# 1. stop the old stack and move the deploy directory
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
mv ~/dev/devkit ~/dev/baseware

# 2. clone each volume under the new project prefix
for v in postgres_data postgres_backups redis_data server-generated; do
  docker volume create "baseware_${v}"
  docker run --rm -v "devkit_${v}":/from -v "baseware_${v}":/to alpine cp -a /from/. /to/
done

# 3. start from the new directory
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d
```

`JWT_ISSUER`/`JWT_AUDIENCE` defaults also changed, and tokens are verified against them: existing refresh tokens stop validating, so every session signs in again. Keep the old values in `.env` to skip that, or accept the one-time re-login.

## Backup / restore runbook

```sh
# list
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db-backup ls -l /backups
# restore (downtime window, tested monthly)
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker volume rm baseware_postgres_data
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d db
cat backups/latest.sql.gz | gunzip | docker compose exec -T db psql -U $DB_USER -d $DB_NAME
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Storage (S3)

`/uploads/url` is fail-closed without `S3_BUCKET + S3_ACCESS_KEY + S3_SECRET_KEY`. Set `S3_ENDPOINT` for MinIO/R2, `S3_REGION`, `S3_PUBLIC_BASE_URL` for CDN, `UPLOAD_MAX_MB` (default 10). Keys are forced to `orgs/{orgId}/{ts}-{sanitized}` with allowlisted `contentType`; plan gate Starter+ and verified e-mail required.

## CI/CD

Push to `master` → GH Action copies files via SCP, writes `.env` from secrets (single-quoted `printf`), runs prod compose, deletes `.env`. Required secrets: `HOST, USERNAME, PRIVATE_KEY, SSH_PORT, DB_*, DATABASE_URL, JWT_SECRET, STRIPE_*, GOOGLE_*, GITHUB_*, API_PUBLIC_URL, FRONTEND_URL, RESEND_API_KEY, SENTRY_DSN, POSTHOG_KEY, ADMIN_EMAIL`.
