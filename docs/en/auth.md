# Auth

Cookie sessions: 15-min access + rotating 7-day refresh (`HttpOnly + Secure + SameSite=Lax`). The SPA silently calls `/auth/refresh` once on 401 before logging out.

Session lifetime rules: password change/reset revokes every session immediately; deactivated users are rejected on the next request (access tokens carry `iat`, checked against `passwordChangedAt`).

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Zod-validated, bcrypt-12, rate-limited 20/h, generic response (no enumeration), sends verification email |
| POST | `/auth/login` | Rate-limited 10/15min, generic errors, lockout 5→15min / 10→1h |
| POST | `/auth/refresh` | Rotates pair, reuse revokes family, rejects inactive users |
| POST | `/auth/logout` | Clears cookies, revokes `jti` |
| GET | `/auth/me` | Session restore for `AuthContext` (includes `permissions` for `PageRoute`) |
| POST | `/auth/password` | Change password (current required), revokes all other sessions |
| DELETE | `/auth/account` | Delete own account (password confirmation when set) |
| POST | `/auth/reset/request` | Always 200, rate-limited 3/h |
| POST | `/auth/reset/confirm` | Single-use SHA-256 token, 1h expiry, revokes all sessions |
| POST | `/auth/verify/request` | Resend verification email (authed, rate-limited 3/h) |
| POST | `/auth/verify/confirm` | Confirms 24h signed email token |
| GET | `/auth/oauth/providers` | Lists `google`/`github` + `configured` flag (drives login buttons) |
| GET | `/auth/oauth/:provider` | Rate-limited 30/15min, sets `state`+PKCE cookies, 302 to provider |
| GET | `/auth/oauth/:provider/callback` | Validates `state`, exchanges code, issues cookie session, 302 to app |

## Social login (Google + GitHub)

Standard authorization-code flow with `state` (CSRF, timing-safe compare) + PKCE-S256 (Google) and `client_secret` exchange (both). Configure in the provider console with redirect URI `${API_PUBLIC_URL}/auth/oauth/<provider>/callback`, then set `GOOGLE_CLIENT_ID/SECRET` and `GITHUB_CLIENT_ID/SECRET`. Empty credentials hide the buttons automatically (fail closed).

Account rules:

- Existing linked `OAuthAccount(provider, providerId)` → login (respects `active`, same session cookies as password login).
- Same email exists + provider email verified → link account, set `emailVerifiedAt`, login.
- Same email exists + provider email NOT verified → redirect `?error=account-exists` (no takeover via unverified emails).
- New email → user + linked account + personal workspace (owner) are created, then login.

After any code change run `npx prisma migrate dev` + `npx prisma generate` (new `oauth_accounts` table).

## Frontend rules

Never use `localStorage` for tokens. `services/api.ts` sends `credentials:"include"` and dispatches `unauthorized` on 401; `AuthContext` listens and redirects to `/login`.
