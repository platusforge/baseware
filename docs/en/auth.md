# Auth

Cookie sessions: 15-min access + rotating 7-day refresh (`HttpOnly + Secure + SameSite=Lax`). The SPA silently calls `/auth/refresh` once on 401 before logging out.

Session lifetime rules: password change/reset revokes every session immediately; deactivated users are rejected on the next request (access tokens carry `iat`, checked against `passwordChangedAt`).

Email verification is enforced for paid/abuse-sensitive actions (`REQUIRE_VERIFIED_EMAIL=true`): checkout, invites, api-keys and uploads return 403 until verified. Login stays allowed so users can reach Settings → Resend. Disable only for closed betas.

MFA (TOTP, no extra deps): `POST /auth/mfa/setup` → secret + `otpauthUrl`, `POST /auth/mfa/confirm { code }` → backup codes (SHA-256 stored, single-use). Login with `mfaEnabled` requires `{ mfaCode }` or returns `403 MFA_REQUIRED`. Disable revokes all sessions. Sessions: `GET /auth/sessions`, `DELETE /auth/sessions/:id`.

Seeded `admin@example.com` ships with `mustChangePassword=true`. Dashboard shows a blocking banner until changed; `POST /auth/password` clears the flag and revokes other sessions.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Zod-validated, bcrypt-12, rate-limited 20/h, generic response (no enumeration), sends verification email |
| POST | `/auth/login` | Rate-limited 10/15min, generic errors, lockout 5→15min / 10→1h |
| POST | `/auth/refresh` | Rate-limited 10/15min, rotates pair, reuse revokes family, rejects inactive users |
| POST | `/auth/logout` | Clears cookies, revokes `jti` via `LogoutService` |
| GET | `/auth/me` | Session restore for `AuthContext` (includes `permissions` for `PageRoute`) |
| POST | `/auth/password` | Change password (current required), revokes all other sessions, clears `mustChangePassword` |
| DELETE | `/auth/account` | Delete own account (password confirmation when set) |
| POST | `/auth/mfa/setup` | Start TOTP (returns secret + otpauthUrl) |
| POST | `/auth/mfa/confirm` | Verify 6-digit code, enable MFA, returns backup codes |
| POST | `/auth/mfa/disable` | Disable with TOTP or backup code, revokes all sessions |
| GET | `/auth/sessions` | List last 20 refresh families |
| DELETE | `/auth/sessions/:id` | Revoke one session |
| GET | `/auth/privacy/export` | LGPD/GDPR export (user, orgs, key metadata, notifications, audit) |
| POST | `/auth/reset/request` | Always 200, rate-limited 3/h |
| POST | `/auth/reset/confirm` | Rate-limited 3/h, single-use SHA-256 token, 1h expiry, revokes all sessions. Frontend: `/reset-password?token=` renders the confirm form |
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
