# Follow the Money — Cloudflare D1 Storage + Password Login

**Date:** 2026-08-30
**Status:** Approved by Shay

## Goal

Replace GitHub-commit persistence and the GitHub-token login with a Cloudflare
Pages Functions backend: username/password login for Shay + family (shared
portfolio), data in a D1 database with an append-only value history. No more
git commits for data, no more GitHub PAT.

## Constraints

- **Cloudflare free plan.** Pages Functions (100k req/day), D1 (5M row
  reads/day, 100k writes/day, 5GB). Expected usage is a fraction of a percent.
- **Frontend unchanged where possible.** The API returns the portfolio in the
  same JSON shape the app uses today (`investments[]` each with `updates[]`,
  plus `metadata`), so `src/lib/domain/`, stores, views, and their tests stay
  intact. Only the data layer and login UI change.
- **Append-only values.** Asset amounts are never UPDATEd — every value is a
  new inserted row. Asset settings live in a separate, updatable table.
- **No data loss.** One-time migration imports `data.json` (all assets, full
  update history, types). `data.json` remains in the repo as a frozen backup.
  Asset deletion is soft (`deleted_at`).
- **Cloudflare only.** The GH Pages deploy job is removed (Functions cannot
  run there). Production is `follow-the-money-5j7.pages.dev`.

## Database schema (D1 / SQLite)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- PBKDF2: iterations$salt$hash (base64)
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,               -- 256-bit random, hex
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL              -- sliding 90 days
);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,                  -- keeps existing ids from data.json
  name TEXT NOT NULL,
  investment_type TEXT NOT NULL,
  currency TEXT NOT NULL,
  start_date TEXT NOT NULL,
  initial_amount REAL NOT NULL,
  profit_type TEXT NOT NULL,
  profit_rate REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_liquid INTEGER NOT NULL DEFAULT 0,
  liquidity_date TEXT,
  track_profit INTEGER NOT NULL DEFAULT 0,
  staleness_reminder INTEGER NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  deleted_at TEXT,                      -- soft delete
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE asset_updates (            -- INSERT-ONLY, never UPDATE/DELETE
  id INTEGER PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  date TEXT NOT NULL,                   -- YYYY-MM-DD (value effective date)
  amount REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id)
);
CREATE INDEX idx_updates_asset_date ON asset_updates(asset_id, date, id);

CREATE TABLE investment_types (
  name TEXT PRIMARY KEY,
  exclude_periodical_profit INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE login_attempts (           -- rate limiting
  ip TEXT NOT NULL,
  attempted_at TEXT NOT NULL
);
```

**Correction semantics:** the app's view of an asset's history is the **latest
inserted row per (asset_id, date)** — `MAX(id)` wins. Entering a corrected
amount for an existing date inserts a new row; the old one stays as audit
trail but is not shown.

## Auth

- PBKDF2-SHA256 via WebCrypto (no dependencies), 100k iterations, per-user
  random salt. Stored as `iterations$salt$hash`.
- Login: `POST /api/login {username, password}` → on success sets cookie
  `ftm_session` (HttpOnly; Secure; SameSite=Strict; Path=/), token stored in
  `sessions` with 90-day sliding expiry (refreshed when < 45 days remain).
- All other `/api/*` routes 401 without a valid session.
- Rate limit: max 10 failed logins per IP per 15 minutes (checked against
  `login_attempts`; old rows pruned opportunistically).
- No public signup. Users seeded by migration (Shay + family), each with
  `must_change_password = 1`; the app forces `POST /api/password` on first
  login. Any logged-in user can change their own password.

## API (Pages Functions, `functions/api/`)

| Route | Method | Body → Result |
|---|---|---|
| `/api/login` | POST | `{username, password}` → `{ok, mustChangePassword}` + cookie |
| `/api/logout` | POST | clears session row + cookie |
| `/api/me` | GET | `{username, mustChangePassword}` or 401 |
| `/api/password` | POST | `{current, next}` → `{ok}` |
| `/api/portfolio` | GET | `{investments: [...], metadata: {...}}` — same shape as today's data.json; excludes soft-deleted assets; updates = latest row per date, sorted |
| `/api/assets` | POST | asset fields → creates asset + first `asset_updates` row (start_date, initial_amount); returns new id |
| `/api/assets/:id` | PATCH | settings fields only (no amounts) |
| `/api/assets/:id` | DELETE | sets `deleted_at` |
| `/api/updates` | POST | `[{asset_id, date, amount}]` → bulk insert (check-in = one call; single update = array of one) |
| `/api/types` | POST | `{name, exclude_periodical_profit}` |
| `/api/types/:name` | PATCH | `{exclude_periodical_profit}` |

Validation server-side mirrors `domain/validation.js` rules (required fields,
positive amounts, no future dates, duplicate name+start_date). Errors return
`{error}` with 4xx.

## Frontend changes

- New `src/lib/data/api.js` replaces `github.js`/`token.js` usage: same
  interface the portfolio store consumes (`load()`, plus granular calls). The
  portfolio store's mutations call the granular endpoints instead of
  whole-file save; on success they update local state from the response.
  ConflictError handling is removed (server is the single source of truth;
  last-write-wins on settings, appends never conflict).
- `TokenGate` → `LoginGate`: username + password form; forced
  change-password screen when `mustChangePassword`.
- Settings: "GitHub connection" section → "Account" (change password,
  logout). Exchange-rate fetch stays as-is (client-side).
- Deleted: `src/lib/data/github.js`, `src/lib/data/token.js`, token UI, and
  their tests (replaced by api/auth tests).

## Migration & rollout

1. `schema.sql` applied via `wrangler d1 create follow-the-money` +
   `wrangler d1 execute`.
2. `scripts/migrate-data.mjs` reads `data.json` → INSERTs types, assets, and
   every historical update row (preserving dates); verify: counts and
   per-asset latest amounts match `data.json`; total value recomputed equals
   the app's current total.
3. Seed users (Shay + family usernames provided at migration time) with
   temporary passwords, `must_change_password = 1`.
4. D1 binding `DB` added to the Pages project; deploy; log in; verify.
5. Remove GH Pages deploy job from CI; CI deploys to Cloudflare via wrangler
   (needs the Cloudflare token as a GitHub secret — Shay adds it, or deploys
   stay manual via wrangler until then).

## Testing

- **Backend:** `@cloudflare/vitest-pool-workers` with a real local D1:
  password hash round-trip; login/logout/session expiry; 401 gates; rate
  limit; portfolio shape (latest-row-per-date, soft-delete exclusion);
  append-only invariant (correction inserts, never updates); bulk check-in.
- **Frontend:** existing domain/view unit tests unchanged; e2e mocks
  `/api/*` (same pattern as the GitHub mocks today) for login, dashboard,
  check-in, asset CRUD; one manual integration pass against
  `wrangler pages dev` with a seeded local D1 before production deploy.

## Out of scope

- Public signup, password reset by email, per-user portfolios, roles.
- Historical exchange rates (still current-rate conversion, client-side).
- Deleting/pruning audit rows.
