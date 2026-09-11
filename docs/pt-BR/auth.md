# Auth

Sessões em cookie: access 15min + refresh rotativo 7 dias (`HttpOnly + Secure + SameSite=Lax`).

## Endpoints

| Método | Rota | Notas |
|---|---|---|
| POST | `/auth/register` | Validado com Zod, bcrypt-12 |
| POST | `/auth/login` | Rate-limit 10/15min, erros genéricos, lockout 5→15min / 10→1h |
| POST | `/auth/refresh` | Rotaciona o par, reuso revoga a família |
| POST | `/auth/logout` | Limpa cookies, revoga `jti` |
| GET | `/auth/me` | Restaura sessão no `AuthContext` |
| POST | `/auth/reset/request` | Sempre 200, rate-limit 3/h |
| POST | `/auth/reset/confirm` | Token SHA-256 uso único, 1h |
| GET | `/auth/oauth/providers` | Lista `google`/`github` + flag `configured` (controla os botões do login) |
| GET | `/auth/oauth/:provider` | Rate-limit 30/15min, grava cookies `state`+PKCE, 302 para o provider |
| GET | `/auth/oauth/:provider/callback` | Valida `state`, troca o code, emite sessão em cookie, 302 para o app |

## Login social (Google + GitHub)

Flow authorization-code padrão com `state` (CSRF, comparação timing-safe) + PKCE-S256 (Google) e exchange com `client_secret` (ambos). Configure no console do provider com redirect URI `${API_PUBLIC_URL}/auth/oauth/<provider>/callback` e defina `GOOGLE_CLIENT_ID/SECRET` e `GITHUB_CLIENT_ID/SECRET`. Credenciais vazias escondem os botões automaticamente (fail closed).

Regras de conta:

- `OAuthAccount(provider, providerId)` já vinculada → login (respeita `active`, mesmos cookies de sessão do login com senha).
- Mesmo email existe + email verificado no provider → vincula, define `emailVerifiedAt`, login.
- Mesmo email existe + email NÃO verificado → redirect `?error=account-exists` (sem takeover via emails não verificados).
- Email novo → cria usuário + conta vinculada + workspace pessoal (owner), depois login.

Após mudar o schema rode `npx prisma migrate dev` + `npx prisma generate` (nova tabela `oauth_accounts`).

## Regras do frontend

Nunca use `localStorage` para tokens. O `services/api.ts` envia `credentials:"include"` e dispara `unauthorized` no 401; o `AuthContext` escuta e redireciona para `/login`.
