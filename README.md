# Follow the Money

A personal investment portfolio tracker. Mobile-first Svelte app hosted on
Cloudflare Pages, backed by a Cloudflare D1 database for accounts and data.

## Features

- **Dashboard** — total value (₪), monthly/yearly profit with tap-to-expand
  calculation breakdowns, portfolio-value-over-time chart, liquidity and
  per-type charts.
- **Assets** — filter/sort your investments, subtle staleness dots for assets
  that haven't been updated in a while, per-asset detail with value history
  chart, return %, and update timeline.
- **Check-in** — walk over all active assets once a month, type the new
  values, and save everything as one batch.
- **Settings** — password change, staleness threshold, investment types.

## How it works

The app is a static Svelte bundle served by Cloudflare Pages; the backend is
a set of Cloudflare Pages Functions (`functions/api/`) backed by a D1
database.

- **Accounts & login** — there is no self-service signup. An admin seeds each
  account (see `scripts/seed-user.mjs`) with a temporary password; the app
  forces a password change on first login (`must_change_password`). Sessions
  are stored server-side (`sessions` table) and identified by an HttpOnly
  cookie; a login rate limit protects the login endpoint.
- **Data storage** — investments live in D1 across three tables: `assets`
  (current fields, soft-deleted via `deleted_at` rather than hard-deleted),
  `asset_updates` (append-only value history — corrections are new rows, never
  edits or deletes, so the full history is always recoverable), and
  `investment_types`. The portfolio endpoint resolves the latest update per
  `(asset, date)` to build each asset's `updates` array and `current_amount`.

### Architecture

```
functions/
├── api/          # one file per route (Pages Functions: onRequestGet/Post/…)
│   ├── login.js, logout.js, me.js, password.js
│   ├── portfolio.js
│   ├── assets/[id].js, assets/index.js
│   ├── types/[name].js, types/index.js
│   └── updates.js
└── lib/          # shared server-side logic, no framework dependencies
    ├── auth.js       # password hashing, sessions, cookies
    ├── ratelimit.js  # login rate limiting
    ├── validate.js   # request validation
    ├── portfolio.js  # portfolio shape assembly from D1 rows
    └── schema.js      # single source of truth for the D1 schema

src/
├── lib/
│   ├── domain/     # pure logic: profit, history, validation, staleness…
│   ├── data/       # API client (fetch wrapper for functions/api/*)
│   ├── stores/     # portfolio / settings / ui stores
│   ├── components/ # reusable UI components
│   └── charts.js   # Chart.js config builders (pure)
└── views/          # Dashboard, Assets, AssetDetail, CheckIn, Settings
```

`domain/` and `data/` are plain modules with no DOM or Svelte imports; all
network access goes through an injectable `fetch`, which is what the unit
tests mock. `functions/lib/` has no Cloudflare-Workers-only APIs beyond
WebCrypto and D1's `db.prepare(...)`, so it's also importable directly from
Node (used by `scripts/seed-user.mjs`).

## Development

```bash
npm install
npm run dev         # local dev server (Vite, mocked/no backend)
npm run build        # production build → dist/
npm test             # unit tests (vitest)
npm run test:workers # backend tests against a real local D1 (vitest-pool-workers)
npm run test:e2e     # e2e tests (playwright, mocks /api/*)
```

### Local dev against Cloudflare Pages Functions + D1

To run the full stack (Functions + D1) locally instead of the plain Vite dev
server:

```bash
npm run build

# Regenerate functions/schema.sql from functions/lib/schema.js if it changed:
node scripts/emit-schema.mjs > functions/schema.sql

# Apply the schema to a local D1 instance:
npx wrangler d1 execute follow-the-money --local --file functions/schema.sql

# (First time / to load real data) generate and apply a migration from data.json:
node scripts/migrate-data.mjs --out migration.sql
npx wrangler d1 execute follow-the-money --local --file migration.sql

# Seed a login (prints the INSERT to stdout, the temp password to stderr):
node scripts/seed-user.mjs shay > seed-shay.sql
npx wrangler d1 execute follow-the-money --local --file seed-shay.sql

npm run dev:cf   # wrangler pages dev dist --local
```

`migration.sql` and any `seed-*.sql` files are generated artifacts — they are
git-ignored and should never be committed (they can contain real portfolio
data or password hashes).

## Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name follow-the-money --branch main
```

The D1 binding (`DB`, matching `wrangler.toml`) must be configured on the
Cloudflare Pages project (dashboard → Settings → Functions → D1 database
bindings, or the Pages API) before the deployed Functions can reach the
database.

CI (`.github/workflows/test.yml`) runs unit and e2e tests on every push/PR;
it does not deploy. Deploys are manual via `wrangler` until a Cloudflare API
token is added as a repo secret.

## Data format / migration

`data.json` at the repo root is a **frozen backup** of the pre-D1 data — it
is no longer read or written by the running app, but is kept as a
point-in-time export and as the source for `scripts/migrate-data.mjs`, which
regenerates a SQL migration from it (types, assets, and every historical
update row). Its shape:

```json
{
  "version": "1.0",
  "lastUpdated": "…",
  "investments": [
    {
      "id": "…", "name": "…", "is_active": true, "track_profit": true,
      "start_date": "YYYY-MM-DD", "initial_amount": 0, "currency": "ILS|USD",
      "current_amount": 0, "profit_type": "price|commission|other",
      "investment_type": "…", "is_liquid": false, "profit_rate": 6.75,
      "updates": [{ "date": "YYYY-MM-DD", "amount": 0 }]
    }
  ],
  "metadata": {
    "currencies": ["ILS", "USD"],
    "profit_types": ["price", "commission", "other"],
    "investment_types": [{ "name": "…", "exclude_periodical_profit": false }]
  }
}
```

To verify a migration matches this backup, run
`node scripts/verify-migration.mjs <base_url> <session_cookie>` against a
deployed instance — it fetches `/api/portfolio` and compares asset counts,
per-asset latest amounts, and per-asset update counts against `data.json`.
