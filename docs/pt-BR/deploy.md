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
- A API não é publicada no host: o Traefik expõe apenas `:80`/`:443` e o nginx faz proxy de `/api/*` para `server:3000` na rede interna do Docker. Não existe entrypoint HTTP puro para a API.
- `VITE_API_URL=/api` em prod (bakeado no build via `args`; trocar `VITE_*` exige `build`).
- `APP_HOST` define o `Host()` do Traefik (sem hardcoded). Healthchecks: `db`, `server` (`/health`), `web`, `redis` (perfil `with-redis`).
- Backups diários (`db-backup`, 7 diários + 4 semanais + 6 mensais). Offsite: sincronize `/backups` para S3. Restore: derrube o compose, recrie o volume, importe o dump (runbook na doc EN).
- Rate-limit distribuído com `REDIS_URL` (perfil `with-redis`); sem Redis, modo single-replica com aviso em prod.
- Após o primeiro boot, troque a senha do admin seed (`mustChangePassword=true`, banner bloqueia até trocar) e rotacione o `JWT_SECRET` (produção recusa boot com o placeholder público).
- Storage S3 fail-closed: sem `S3_BUCKET + S3_ACCESS_KEY + S3_SECRET_KEY`, `/uploads/url` retorna erro. Chaves forçadas em `orgs/{orgId}/...`, gate Starter+ e e-mail verificado.

## Renomeando de DevKit

O Compose prefixa todo volume com o nome do projeto, então o rename sobe com banco vazio se os volumes não forem copiados:

```sh
# 1. derrube a stack antiga e mova o diretório de deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
mv ~/dev/devkit ~/dev/baseware

# 2. clone cada volume com o novo prefixo
for v in postgres_data postgres_backups redis_data server-generated; do
  docker volume create "baseware_${v}"
  docker run --rm -v "devkit_${v}":/from -v "baseware_${v}":/to alpine cp -a /from/. /to/
done

# 3. suba a partir do novo diretório
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d
```

Os defaults de `JWT_ISSUER`/`JWT_AUDIENCE` também mudaram e os tokens são validados contra eles: refresh tokens existentes param de valer e todo mundo loga de novo. Para evitar, mantenha os valores antigos no `.env` ou aceite o re-login único.

## CI/CD

Push em `master` faz deploy; PRs rodam verify (typecheck + testes + audit + Trivy config, sem deploy). GH Action copia via SCP, escreve `.env` a partir dos secrets (`printf` com aspas simples), sobe o compose de prod, apaga o `.env`. Secrets: `HOST, USERNAME, PRIVATE_KEY, SSH_PORT, DB_*, DATABASE_URL, JWT_SECRET, STRIPE_*, GOOGLE_*, GITHUB_*, API_PUBLIC_URL, FRONTEND_URL, RESEND_API_KEY, SENTRY_DSN, POSTHOG_KEY, ADMIN_EMAIL, APP_HOST, S3_*, REDIS_URL`.
