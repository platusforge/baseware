# Deploy

## Desenvolvimento

```sh
docker compose up --build
```

## Produção (Traefik + TLS)

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

- `:443` serve web + `/api/*` (TLS via Let's Encrypt). Todo tráfego de auth passa aqui.
- `:3001` serve a API direta (só tráfego não-auth com IP allowlist — nunca login/refresh).
- `VITE_API_URL=/api` em prod (bakeado no build via `args`).
- Backups diários do banco (`db-backup`, retenção 7 dias).

## CI/CD

Push em `master` → GH Action copia via SCP, escreve `.env` a partir dos secrets (`printf` com aspas simples), sobe o compose de prod, apaga o `.env`. Secrets: `HOST, USERNAME, PRIVATE_KEY, SSH_PORT, DB_*, DATABASE_URL, JWT_SECRET, STRIPE_*, SMTP_*, ADMIN_EMAIL`.
