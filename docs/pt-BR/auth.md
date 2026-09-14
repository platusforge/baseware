# Auth

Sessões em cookie: access 15min + refresh rotativo 7 dias (`HttpOnly + Secure + SameSite=Lax`). O SPA tenta `/auth/refresh` silenciosamente uma vez no 401 antes de deslogar.

Regras de lifetime: troca/reset de senha revoga todas as sessões na hora; usuários desativados são rejeitados no próximo request (access tokens carregam `iat`, comparado com `passwordChangedAt`).

Verificação de e-mail exigida para ações pagas/sensíveis (`REQUIRE_VERIFIED_EMAIL=true`): checkout, convites, api-keys e uploads retornam 403 até verificar. Login continua permitido para alcançar Configurações → Reenviar. MFA (TOTP, sem deps): `POST /auth/mfa/setup` → secret + otpauthUrl, `POST /auth/mfa/confirm { code }` → backup codes. Login com MFA exige `{ mfaCode }` ou retorna `403 MFA_REQUIRED`. Sessões: `GET /auth/sessions`, `DELETE /auth/sessions/:id`. Exportação LGPD: `GET /auth/privacy/export`. Seed `admin@example.com` com `mustChangePassword=true` (banner bloqueia até trocar).

## Endpoints

| Método | Rota | Notas |
|---|---|---|
| POST | `/auth/register` | Validado com Zod, bcrypt-12, rate-limit 20/h, resposta genérica (sem enumeração), envia e-mail de verificação |
| POST | `/auth/login` | Rate-limit 10/15min, erros genéricos, lockout 5→15min / 10→1h |
| POST | `/auth/refresh` | Rate-limit 10/15min, rotaciona o par, reuso revoga a família, rejeita inativos |
| POST | `/auth/logout` | Limpa cookies, revoga `jti` via `LogoutService` |
| GET | `/auth/me` | Restaura sessão no `AuthContext` (inclui `permissions` p/ `PageRoute`) |
| POST | `/auth/password` | Troca de senha (atual obrigatória), revoga as demais sessões |
| DELETE | `/auth/account` | Exclui a própria conta (confirmação de senha quando houver) |
| POST | `/auth/reset/request` | Sempre 200, rate-limit 3/h |
| POST | `/auth/reset/confirm` | Rate-limit 3/h, token SHA-256 uso único, 1h, revoga todas as sessões. Frontend: `/reset-password?token=` mostra o form de confirmação |
| POST | `/auth/verify/request` | Reenvia e-mail de verificação (autenticado, rate-limit 3/h) |
| POST | `/auth/verify/confirm` | Confirma token assinado de 24h |
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
