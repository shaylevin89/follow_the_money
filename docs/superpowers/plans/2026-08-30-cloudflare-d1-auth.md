# Cloudflare D1 Storage + Password Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace GitHub-commit persistence and token login with Cloudflare Pages Functions + D1: username/password auth (shay, naama), append-only value history, same frontend.

**Architecture:** `functions/api/*` Pages Functions with a D1 binding `DB`. Append-only `asset_updates` (latest row per (asset_id, date) wins), updatable `assets` settings, soft delete. `/api/portfolio` returns the exact JSON shape the frontend already consumes, so `src/lib/domain/`, views and their tests stay untouched; only the data layer and the login gate change.

**Tech Stack:** Cloudflare Pages Functions, D1 (SQLite), WebCrypto PBKDF2, wrangler, @cloudflare/vitest-pool-workers, existing Vite/Svelte 5/Vitest/Playwright stack.

**Spec:** `docs/superpowers/specs/2026-08-30-cloudflare-d1-auth-design.md` (schema SQL and API table live there — copy them verbatim where referenced).

## Global Constraints

- Cloudflare free plan; D1 binding name `DB`; Pages project `follow-the-money`.
- `asset_updates` is INSERT-only. Corrections insert a new row; reads take `MAX(id)` per (asset_id, date).
- `/api/portfolio` response shape identical to today's `data.json` shape (investments[] with updates[], metadata).
- Asset deletion = `deleted_at` timestamp; deleted assets excluded from portfolio.
- Sessions: HttpOnly Secure SameSite=Strict cookie `ftm_session`, 90-day sliding expiry.
- Users seeded: `shay`, `naama`, `must_change_password=1`.
- Existing unit/e2e suites must stay green throughout (adapt mocks, never weaken assertions).
- data.json stays in repo, frozen, after migration verification.

---

### Task 1: Backend scaffold (wrangler, schema, workers test harness)

**Files:**
- Create: `wrangler.toml`, `functions/schema.sql`, `vitest.workers.config.js`, `tests/workers/smoke.test.js`
- Modify: `package.json` (scripts: `test:workers`, `dev:cf`), `.gitignore` (`.wrangler/`)

**Interfaces:**
- Produces: D1 binding `env.DB` in functions and workers tests; `npm run test:workers` runs `tests/workers/**`; `npm run dev:cf` = `wrangler pages dev dist --local` with D1.

Steps:
- [ ] `npm install -D wrangler @cloudflare/vitest-pool-workers`
- [ ] `wrangler.toml`:

```toml
name = "follow-the-money"
compatibility_date = "2026-08-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "follow-the-money"
database_id = "placeholder-filled-in-task-8"
```

- [ ] `functions/schema.sql`: copy the full schema from the spec verbatim (users, sessions, assets, asset_updates + index, investment_types, login_attempts).
- [ ] `vitest.workers.config.js`:

```js
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['tests/workers/**/*.test.js'],
    poolOptions: {
      workers: {
        miniflare: { d1Databases: { DB: 'test-db' } },
      },
    },
  },
});
```

- [ ] `tests/workers/smoke.test.js`: read `functions/schema.sql`? (fs unavailable in workers pool) — instead import schema as a string: create `functions/schema.js` exporting `export const SCHEMA = \`...\`` (generated from schema.sql by hand, kept in sync — single source: schema.js; schema.sql is generated FROM it by `node scripts/emit-schema.mjs > functions/schema.sql`). Test:

```js
import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { SCHEMA } from '../../functions/lib/schema.js';

async function applySchema(db) {
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(stmt).run();
  }
}

describe('schema', () => {
  beforeAll(() => applySchema(env.DB));
  it('creates the tables', async () => {
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();
    const names = results.map((r) => r.name);
    for (const t of ['users','sessions','assets','asset_updates','investment_types','login_attempts'])
      expect(names).toContain(t);
  });
});
```

  (So: `functions/lib/schema.js` is the source of truth; `scripts/emit-schema.mjs` writes `functions/schema.sql` for wrangler d1 execute. Move `applySchema` into `tests/workers/helpers.js` for reuse.)
- [ ] Run `npm run test:workers` → PASS; `npm test` still green; commit.

### Task 2: Auth library (hashing, sessions, cookies)

**Files:**
- Create: `functions/lib/auth.js`, `tests/workers/auth.test.js`

**Interfaces:**
- Produces:
  - `hashPassword(password) -> Promise<string>` (`"100000$<saltB64>$<hashB64>"`)
  - `verifyPassword(password, stored) -> Promise<boolean>`
  - `createSession(db, userId) -> Promise<string>` (hex token; inserts sessions row, 90d expiry)
  - `getSessionUser(db, request) -> Promise<{id, username, must_change_password}|null>` (reads `ftm_session` cookie, checks expiry, slides expiry when < 45 days remain)
  - `destroySession(db, request) -> Promise<void>`
  - `sessionCookie(token) -> string` and `clearSessionCookie() -> string` (Set-Cookie values: HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age)
  - `json(data, status=200, headers={}) -> Response`

Steps:
- [ ] Failing tests: hash → verify round-trip true; wrong password false; tampered stored string false; createSession + getSessionUser round-trip via a Request with the cookie header; expired session (UPDATE expires_at to past) → null; destroySession → null.
- [ ] Implement with WebCrypto (`crypto.subtle.importKey('raw', ...)` + `deriveBits` PBKDF2-SHA256, 100000 iterations, 16-byte salt, 32-byte hash; constant-time compare by hashing then comparing base64 strings via `crypto.subtle.timingSafeEqual`-equivalent manual loop).
- [ ] Tests pass; commit.

### Task 3: Auth endpoints (login/logout/me/password) + rate limit

**Files:**
- Create: `functions/api/login.js`, `functions/api/logout.js`, `functions/api/me.js`, `functions/api/password.js`, `functions/lib/ratelimit.js`, `tests/workers/auth-endpoints.test.js`
- Create: `tests/workers/helpers.js` additions: `seedUser(db, username, password)`, `callFn(mod, {method, body, cookie, env, ip})` building a Pages Functions context `{request, env}` and invoking `onRequestPost`/`onRequestGet`.

**Interfaces:**
- Consumes: Task 2 auth lib.
- Produces: HTTP contract from the spec table. `login` returns `{ok:true, mustChangePassword}` + Set-Cookie; failures 401 `{error}`; rate limit 429 after 10 failed attempts per IP (from `CF-Connecting-IP` header) in 15 min. `password` requires session, verifies `current`, rejects `next` shorter than 8 chars, sets `must_change_password=0`.

Steps (TDD):
- [ ] Failing tests: login success sets cookie + returns mustChangePassword; wrong password 401 and records attempt; 11th failed attempt within window → 429 even with right password; me without cookie 401, with cookie returns username; password change flow (old password stops working, new works, mustChangePassword cleared); logout clears session.
- [ ] Implement endpoints; commit.

### Task 4: Portfolio read endpoint

**Files:**
- Create: `functions/api/portfolio.js`, `functions/lib/portfolio.js`, `tests/workers/portfolio.test.js`
- Create: `tests/workers/helpers.js` additions: `seedAsset(db, {id, name, ...})`, `seedUpdate(db, assetId, date, amount)`

**Interfaces:**
- Produces: `getPortfolio(db) -> Promise<{investments, metadata}>` and GET `/api/portfolio` (auth-gated). Investment objects carry the exact field names the frontend uses today: `id,name,is_active,track_profit,start_date,end_date:null,initial_amount,currency,current_amount,profit_type,notes,is_liquid,investment_type,liquidity_date,staleness_reminder,updates:[{date,amount}],profit_rate?`. `current_amount` = amount of latest-dated update (latest row per date, `MAX(id)` wins). `metadata = {currencies:['ILS','USD'], profit_types:['price','commission','other'], investment_types:[{name, exclude_periodical_profit:boolean}]}`.

Key SQL:

```sql
SELECT u.asset_id, u.date, u.amount FROM asset_updates u
JOIN (SELECT asset_id, date, MAX(id) AS mid FROM asset_updates GROUP BY asset_id, date) m
  ON u.id = m.mid
ORDER BY u.asset_id, u.date
```

Steps:
- [ ] Failing tests: shape matches spec (booleans are true/false not 0/1); duplicate-date rows → only latest returned; soft-deleted asset excluded; 401 without session.
- [ ] Implement; commit.

### Task 5: Mutation endpoints (assets, updates, types)

**Files:**
- Create: `functions/api/assets/index.js` (POST), `functions/api/assets/[id].js` (PATCH, DELETE), `functions/api/updates.js` (POST bulk), `functions/api/types/index.js` (POST), `functions/api/types/[name].js` (PATCH), `functions/lib/validate.js`, `tests/workers/mutations.test.js`

**Interfaces:**
- Consumes: Tasks 2/4 helpers.
- Produces (all auth-gated, errors `{error}` 4xx):
  - POST `/api/assets` body = asset fields (id generated `Date.now().toString()`), inserts assets row + first `asset_updates` row (start_date, initial_amount); returns full portfolio-shaped investment object.
  - PATCH `/api/assets/:id` — allowed fields only: name, investment_type, currency, start_date, initial_amount, profit_type, profit_rate, is_active, is_liquid, liquidity_date, track_profit, staleness_reminder, notes. Amount fields in `asset_updates` untouched.
  - DELETE `/api/assets/:id` → `deleted_at = datetime('now')`.
  - POST `/api/updates` body `[{asset_id, date, amount}]` → one INSERT per item with `created_by`; rejects non-positive/NaN amounts, bad dates (`YYYY-MM-DD` regex), unknown/deleted asset ids; on success returns `{inserted: n}`.
  - POST `/api/types` `{name, exclude_periodical_profit}` (409 on duplicate name, case-insensitive); PATCH `/api/types/:name`.
- `validate.js` produces `validateAssetFields(fields, existingAssets, excludeId)` mirroring `src/lib/domain/validation.js` rules (required name/type/currency/profit_type, positive amount, valid non-future start_date, duplicate name+start_date).

Steps:
- [ ] Failing tests: create asset → portfolio contains it with seeded first update; duplicate name+start_date 400; PATCH changes settings and never touches updates (assert update count unchanged); PATCH rejects unknown field `amount`; DELETE soft-deletes (portfolio excludes, row remains); bulk updates insert append-only (same date twice → two rows, portfolio shows latest); types add/patch.
- [ ] Implement; commit.

### Task 6: Frontend API client + store rework

**Files:**
- Create: `src/lib/data/api.js`, `tests/unit/api.test.js`
- Modify: `src/lib/stores/portfolio.js`, `tests/unit/portfolio-store.test.js`
- Delete: `src/lib/data/github.js`, `src/lib/data/token.js`, `tests/unit/github.test.js`, `tests/unit/token.test.js`

**Interfaces:**
- Produces `createApiClient({fetchFn = fetch})` with methods (all reject with `Error(message)` on `{error}`/non-2xx; 401 rejects with `AuthError` exported class):
  - `me()`, `login(username, password)`, `logout()`, `changePassword(current, next)`
  - `loadPortfolio() -> {investments, metadata}`
  - `createAsset(fields) -> investment`
  - `patchAsset(id, fields)`, `deleteAsset(id)`
  - `postUpdates(items)` — items `[{asset_id, date, amount}]`
  - `addType(name, exclude)`, `patchType(name, fields)`
- Store keeps its public surface used by views: `state` (now `{data, loading, saving, error, authRequired}`), `load`, `reload`, `addInvestment`, `updateInvestment`, `deleteInvestment`, `addUpdate`, `applyCheckIn`, `addType`, `updateType(idx, fields)` (resolves idx→name from metadata). Mutations call the API then `reload()` (simple, always consistent; portfolio GET is one cheap request). `conflict` flag and ConflictError path removed. 401 during any call sets `authRequired: true`.

Steps:
- [ ] Failing api client unit tests (mock fetchFn: happy paths hit right URL/method/body; 401 → AuthError).
- [ ] Rework portfolio-store tests to a fake api client asserting: addInvestment posts then reloads; applyCheckIn posts ONE bulk request; addUpdate posts array of one; 401 sets authRequired.
- [ ] Implement; delete github/token modules + tests; `npm test` green (dashboard/assets/checkin/asset-detail view tests unchanged — they pass a fake store already... they construct `createPortfolioStore(client)`: update those constructors to the new fake api client shape).
- [ ] Commit.

### Task 7: Login UI + app wiring

**Files:**
- Create: `src/lib/components/LoginGate.svelte`, `src/lib/components/ChangePassword.svelte`, `tests/unit/login-gate.test.js`
- Modify: `src/App.svelte`, `src/views/Settings.svelte`, delete `src/lib/components/TokenGate.svelte` + `tests/unit/smoke.test.js` TokenGate tests (replace file with LoginGate tests)

**Interfaces:**
- `LoginGate` props: `{authed, mustChange, onlogin(username, password), onchangepassword(current, next), children}` — renders login form when `!authed`, forced ChangePassword when `authed && mustChange`, else children. Error message display from rejected promises.
- `App.svelte`: on mount calls `api.me()`; state `{authed, mustChange, username}`; passes an `api`-backed portfolio store; `authRequired` from store flips back to login. Settings "GitHub connection" section replaced by "Account": change password (ChangePassword inline) + Logout button.

Steps:
- [ ] Failing component tests: login form submits credentials; error shown on reject; mustChange forces password screen; children render when authed.
- [ ] Implement; `npm test` + `npm run build` green; commit.

### Task 8: E2E rework (mock /api/*)

**Files:**
- Modify: `tests/e2e/mocks.js` (replace GitHub/rate mocks with `/api/*` route mocks over an in-memory portfolio object; exports `installApiMocks(page, {data})` returning `{posted: {assets:[], updates:[], patches:[]}}`), `tests/e2e/app.spec.js`, `tests/e2e/occlusion.spec.js`
- Keep: exchange-rate mock (still client-side).

Steps:
- [ ] Rewrite specs: login flow (form → dashboard), dashboard totals, assets filter/open/create/edit, check-in bulk = ONE `/api/updates` POST with both items, staleness toggle persists via PATCH body assertion, logout returns to login. Occlusion spec switches to `installApiMocks`.
- [ ] `npx playwright test` green both projects; commit.

### Task 9: Provision, migrate data, deploy, CI

**Files:**
- Create: `scripts/emit-schema.mjs`, `scripts/migrate-data.mjs` (reads `data.json`, emits `migration.sql`: investment_types, assets, all update rows ordered by date), `scripts/verify-migration.mjs` (fetches `/api/portfolio` with a session vs local `data.json`: same asset count, same per-asset latest amount, same update counts)
- Modify: `.github/workflows/static.yml` → rename/replace with `deploy.yml` deploying via `cloudflare/wrangler-action` **only if** repo secret exists — since Shay hasn't added the CF token secret yet, the job stays but is documented to fail-soft: `if: ${{ secrets.CLOUDFLARE_API_TOKEN != '' }}` is not valid YAML for job-level secrets check — instead keep GH Actions to tests only (delete the Pages deploy job) and deploy manually via wrangler until the secret is added. README updated (login model, D1, manual deploy command, no GH Pages).

Steps:
- [ ] `wrangler d1 create follow-the-money` (with song_guess env token) → paste `database_id` into `wrangler.toml`.
- [ ] Apply schema: `wrangler d1 execute follow-the-money --remote --file functions/schema.sql`.
- [ ] Run migrate script → `wrangler d1 execute --remote --file migration.sql`; row counts printed.
- [ ] Seed users shay + naama: generate temp passwords locally (printed ONCE to Shay in chat is NOT ok — instead write them to `~/ftm-temp-passwords.txt` chmod 600 and tell Shay where), hash via a small node script reusing the same PBKDF2 parameters (node webcrypto), insert with `must_change_password=1`.
- [ ] Local integration pass: `npm run build && wrangler pages dev dist --local` + apply schema/migration/users to local D1 → manual login + spot-check portfolio.
- [ ] Deploy: `npm run build && wrangler pages deploy dist --project-name follow-the-money --branch main` (D1 binding comes from wrangler.toml on Pages? For Pages, bindings must be set on the project — set via dashboard-free API call: `PATCH /pages/projects/follow-the-money` with `deployment_configs.production.d1_databases = {DB: {id}}`).
- [ ] `scripts/verify-migration.mjs` against production; totals match data.json.
- [ ] Update workflows (tests only) + README; delete GH Pages deploy job; commit + push; verify Actions green.
- [ ] Report to Shay: URL, usernames, where temp passwords are, first-login forced change.

---

## Self-review notes

- Spec coverage: schema (T1), auth+sessions+rate limit (T2/3), portfolio shape + latest-per-date + soft delete (T4), mutations + append-only + validation (T5), frontend client/store (T6), login UI + settings (T7), e2e (T8), migration/seed/deploy/CI/README (T9). ConflictError removal (T6). data.json frozen (T9 leaves it untouched).
- Type consistency: `createApiClient` method names match store usage (T6→T7); helpers `seedUser/seedAsset/seedUpdate/applySchema/callFn` defined T1/T3/T4 and reused.
- Known risk called out in T9: Pages D1 binding config; wrangler.toml with `pages_build_output_dir` DOES carry d1 bindings for Pages projects on modern wrangler — if the deploy ignores it, use the PATCH API fallback written in the step.
