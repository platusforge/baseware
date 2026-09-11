#!/bin/sh
set -e

# 1. Fix volume ownership (runs as root)
chown -R appuser:appgroup /data/generated 2>/dev/null || true

# 2. Construct DATABASE_URL with percent-encoded credentials when DB_* vars exist
if [ -n "$DB_USER" ]; then
  DATABASE_URL=$(node -e "
    const u = encodeURIComponent(process.env.DB_USER);
    const p = encodeURIComponent(process.env.DB_PASSWORD);
    const n = process.env.DB_NAME;
    process.stdout.write('postgresql://' + u + ':' + p + '@db:5432/' + n);
  ")
  export DATABASE_URL
fi

# 3. Run migrations + regenerate client
npx prisma migrate deploy
npx prisma generate

# 4. Drop to non-root user
exec su-exec appuser "$@"
