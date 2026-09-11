# AGENTS.md — Exclusive manual for AI agents building SaaS products from this boilerplate

> This file is **mandatory reading** before generating ANY feature. It overrides generic training-data patterns. When in conflict with your instincts, this file wins.

## 1. What this boilerplate is

Open Architecture monorepo: `server/` (Express + Prisma + PostgreSQL) and `web/` (React + Vite). Multi-tenant (organizations, invites, roles), per-org Stripe billing, cookie auth, admin/RBAC, API keys, audit logs, Docker-first, bilingual docs.

## 2. Non-negotiable rules (violations = broken PR)

1. **Read before edit.** Never assume file contents; `read` the target + its convention doc first.
2. **Layer chain only:** `Route → Controller → Service → Repository (interface) → Implementation`. No skipping. Controllers: parse → call → respond, no logic, **no logging**. Services: no `req/res`, Zod validation inside, `logger.info` entry/exit + `error` rethrow. Repositories: `error`-only logging, graceful returns.
3. **Constructor DI only.** Never import repository/adapter instances inside services. Wire in `server/src/repositories/index.ts` / `server/src/adapters/index.ts`, inject via constructor. New data source = interface in `types/repositories/` → impl in `repositories/{prisma,fetch,db,xlsx,bcrypt}/` → export in `index.ts` → inject.
4. **Lowercase kebab-case filenames everywhere.** `my-service.ts`, `my-button/index.tsx`. Exceptions only: env vars, CSS custom props, component function names, `Dockerfile`.
5. **Auth via HttpOnly cookies.** `req.user` (never `req.headers.authorization`), generic `Invalid credentials.`, bcrypt-12 via `IPasswordHasher`, rate-limit auth routes, helmet + CORS allowlist. Never log secrets / tokens / passwords.
6. **RBAC scope rule.** `requirePage`/`PageRoute`/`allowedPages`/`Role` tables exist here because this IS a multi-audience B2B app (admins + members in one deployment). Keep resolution Role > UserPermission > `configured:false`. For org-level checks use `requireOrgRole("owner","admin")`.
7. **Docker for everything.** Every instruction must use `docker compose up` / prod variant. Never output bare `npm run dev`. Ship `dockerfile` + `entrypoint.sh` + `nginx.conf` behavior unchanged.
8. **Prisma generate is mandatory** after schema edits, then `migrate dev`. Never skip. IDs `uuid()`, `@@map("snake_case")`, `active` soft-delete, `createdAt/updatedAt`, indexes on filtered fields. Never return `passwordHash` (omitApi + explicit select).
9. **Tests:** Jest unit tests only, mocks via constructor, always mock `@/logger`. New service = new `__tests__/services/{domain}/{service}.test.ts` covering happy path + generic-error/no-enumeration for auth.
10. **Commits/docs in English**, Conventional Commits (`feat:`, `fix:` …), imperative, no trailing period.

## 3. Decision trees

```
New HTTP endpoint?
→ route file (+ rate-limit if auth) → register in routes/index.ts (public BEFORE authMiddleware, protected AFTER)
→ controller method (parse→call→respond) → service class (Zod + logic + logs) → injected repos

New data source?
→ types/repositories/{domain}-repository.ts → repositories/{source}/{source}-{entity}-repository.ts → repositories/index.ts → inject

New UI page?
→ web/src/pages/dashboard/{page}/index.tsx + index.module.css → routes/index.tsx (+ NAV_ITEMS) → PageRoute only if new audience; else PrivateRoute suffices

New billing plan?
→ PLANS in adapters/stripe/stripe-billing-adapter.ts → env STRIPE_PRICE_* → Prisma plan string → pricing-table component → webhook mapping in HandleBillingWebhookService
```

## 4. File placement cheat sheet

| What | Where |
|---|---|
| Repository interface | `server/src/types/repositories/` |
| Repository impl | `server/src/repositories/{prisma,bcrypt}/` |
| DI wiring | `server/src/repositories/index.ts`, `server/src/adapters/index.ts` |
| Service | `server/src/services/{domain}-service/{action}-{domain}-service.ts` |
| Controller | `server/src/controllers/` |
| Route | `server/src/routes/` + mount in `routes/index.ts` |
| Middleware | `server/src/common/` |
| Env | `server/src/env.ts` (Zod; never `process.env` elsewhere) |
| Page | `web/src/pages/dashboard/{page}/index.tsx` |
| Component | `web/src/components/{name}/index.tsx + index.module.css` |
| API client | `web/src/services/api.ts` (`credentials:"include"`, 401 → `unauthorized` event) |

## 5. Copy-paste templates

**Service:**
```ts
import { z } from "zod";
import { logger } from "@/logger";
const schema = z.object({ name: z.string().trim().min(2).max(80) });
export class CreateThingService {
  constructor(private readonly repo: IThingRepository) {}
  async execute(input: unknown) {
    try {
      logger.info("CreateThingService: starting...");
      const data = schema.parse(input);
      const result = await this.repo.create(data);
      logger.info("CreateThingService: completed");
      return result;
    } catch (err) {
      logger.error(`CreateThingService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}
```

**Controller method:**
```ts
async create(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new Error("Missing credentials.");
    const data = await createThingService.execute(req.body);
    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ message: err instanceof Error ? err.message : "Error" });
  }
}
```

**Test:**
```ts
jest.mock("@/logger", () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
describe("CreateThingService", () => {
  it("should create", async () => {
    const repo = { create: jest.fn().mockResolvedValue({ id: "1" }) } as never;
    const svc = new CreateThingService(repo);
    await expect(svc.execute({ name: "Acme" })).resolves.toEqual({ id: "1" });
  });
});
```

## 6. Recipes (most requested builds)

### A. New CRUD entity "Project" (org-scoped) — full stack in order
1. Prisma: `model Project { id uuid, organizationId, name, active, createdAt, updatedAt, @@map("projects") }` → `migrate dev` → `generate`.
2. `types/repositories/project-repository.ts` (interface) → `repositories/prisma/prisma-project-repository.ts` → export in `repositories/index.ts`.
3. `services/project-service/{create,get,list,update,delete}-project-service.ts` (Zod + org check via `membershipRepository.findRole` or rely on `requireOrgRole`).
4. Controller + `routes/project-routes.ts` (`router.get("/:orgId/projects", requireOrgRole(), ctrl.list)`), mount AFTER `authMiddleware`.
5. Test each service. 6. Frontend: `pages/dashboard/projects/index.tsx` using `api.get("/orgId/projects", orgId)` + NAV_ITEMS entry.

### B. New Stripe plan "Scale $99"
1. Create Stripe Price → `STRIPE_PRICE_SCALE` in `.env.example` + `env.ts` + CI secrets.
2. Add to `PLANS` + webhook price→plan mapping. 3. Add card in `pricing-table`. 4. Test checkout with mock mode first.

### C. Invite-only onboarding / custom role
1. Extend `MembershipRole` enum (Prisma + TS type) → migrate. 2. Update `InviteMemberService` Zod enum + `requireOrgRole` call sites. 3. Update seed roles + docs.

### D. API-key-scoped endpoint
Use `apiKeyMiddleware` (header `x-api-key`) instead of `authMiddleware` for that route; check `scopes` in service; `touch()` on use.

### E. New OAuth provider (e.g. Microsoft)
1. Implement `IOAuthAdapter` in `adapters/oauth/<provider>-oauth-adapter.ts` (use `isConfigured()` fail-closed; only auto-link when the provider confirms a verified email).
2. Register in `getOAuthAdapters()` + `OAuthProviderName` union + Zod enums in `start-oauth-service.ts` / `handle-oauth-callback-service.ts`.
3. Add `PROVIDER_CLIENT_ID/SECRET` to `.env.example` + `env.ts` + compose + CI. Buttons appear automatically via `GET /auth/oauth/providers`.

### F. New Stripe webhook event
Add a `case` in `HandleBillingWebhookService.execute` (resolve org via metadata → customer → subscription, in that order), cover it in `billing-webhook-service.test.ts`, test locally with `stripe trigger <event>`. Never return 500 from the route; claim idempotency via `webhookEventRepository` stays first.

## 7. Common pitfalls (check before finishing)

- Route mounted BEFORE `authMiddleware` = public. Verify order in `routes/index.ts`.
- `VITE_API_URL` is build-time: changing it needs `docker compose build`, not just `up`.
- Stripe webhook: raw body comes from `express.json({ verify })` in `app.ts` (`req.rawBody`) — never add path-sniffing parsers; route returns 200/400 only; every event is claimed in `webhook_events` before mutation.
- Refresh reuse (old `jti` presented twice) must revoke the whole family — already implemented; keep it.
- `allowedPages: []` means "all pages" (legacy open mode), `configured:false` blocks. Do not invert.
- Anonymous `/app/node_modules` volume + `CHOKIDAR_USEPOLLING=1` are required for Docker hot reload.
- Never store tokens in `localStorage`; frontend sends nothing — cookies ride via `credentials:"include"`.

## 8. Definition of done for every task

- [ ] Layer chain respected, DI via constructor, kebab-case files
- [ ] Zod validation in service, Edgar-style logs (info in/out, error rethrow)
- [ ] Auth/membership guards on every new route; no secret logging
- [ ] Prisma migrate + generate run; seed updated if roles/plans changed
- [ ] Jest test added/updated and passing (`npm --workspace server test`)
- [ ] Frontend route + NAV_ITEMS + i18n keys (en + pt-BR) if UI changed
- [ ] Docs touched if behavior changed (both languages for user-facing changes)
- [ ] Verified with `docker compose up --build` (or noted why not) + `tsc --noEmit` both workspaces
