# Deploy

## Desenvolvimento

```sh
docker compose up --build
```

## Produção (Traefik + TLS)

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

- `:443` serve web + `/api/*` (TLS via Let's Encrypt, HSTS ativo). Todo tráfego público passa aqui.
- `:3001` serve a API direta em HTTP puro e é restrita a redes privadas pelo `ipallowlist` do Traefik — nunca exponha publicamente, nunca envie credenciais para ela.
- `VITE_API_URL=/api` em prod (bakeado no build via `args`).
- Backups diários do banco (`db-backup`, retenção 7 dias).
- Após o primeiro boot, troque a senha do admin seed (`db:seed` usa default documentado) e rotacione o `JWT_SECRET` (produção recusa boot com o placeholder público).

## CI/CD

Push em `master` → GH Action copia via SCP, escreve `.env` a partir dos secrets (`printf` com aspas simples), sobe o compose de prod, apaga o `.env`. Secrets: `HOST, USERNAME, PRIVATE_KEY, SSH_PORT, DB_*, DATABASE_URL, JWT_SECRET, STRIPE_*, GOOGLE_*, GITHUB_*, API_PUBLIC_URL, FRONTEND_URL, RESEND_API_KEY, SENTRY_DSN, POSTHOG_KEY, ADMIN_EMAIL`.
