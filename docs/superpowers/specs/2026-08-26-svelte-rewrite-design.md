# Follow the Money — Vite + Svelte Rewrite

**Date:** 2026-08-26
**Status:** Approved by Shay

## Goal

Rewrite the investment tracker as a mobile-first Vite + Svelte static app with
clean, testable code — while keeping the same `data.json` schema and the same
GitHub Pages + GitHub API persistence model (and staying deployable to
Cloudflare Pages later).

## Constraints

- **Static hosting only.** GitHub Pages today; must build to a plain static
  bundle that also runs on Cloudflare Pages (configurable base path, no
  server-side code).
- **Same data schema.** `data.json` stays in the repo root with its current
  structure. Changes are additive only (e.g. an optional `settings` block).
  Existing data loads unmodified — no migration.
- **Personal app.** One user, one repo, one token. No auth system, no
  multi-user concerns.

## Approach (chosen)

Clean rewrite: a new `src/` Svelte app built from scratch against the existing
schema. The old app (`app.js`, `index.html`) keeps working until the new app
reaches feature parity, then gets deleted. Rejected alternatives: incremental
strangler refactor (slow, long hybrid state for a 2,000-line global-state
file) and schema redesign (current schema already supports every planned
feature).

## Architecture

```
follow_the_money/
├── src/
│   ├── lib/
│   │   ├── domain/        # pure logic: profit calc, portfolio history,
│   │   │                  #   validation, staleness — no DOM/Svelte imports
│   │   ├── data/          # GitHub Contents API client, exchange-rate
│   │   │                  #   client, load/save, schema helpers
│   │   ├── stores/        # Svelte stores: portfolio, settings, sync status
│   │   └── components/    # UI components (thin; logic lives in domain/)
│   ├── views/             # Dashboard, Assets, AssetDetail, UpdateRound,
│   │                      #   Settings (simple client-side view switching)
│   ├── App.svelte
│   └── main.js
├── data.json              # unchanged location & schema
├── tests/
│   ├── unit/              # vitest: domain + data (mocked fetch)
│   └── e2e/               # playwright: core flows, mocked GitHub API,
│                          #   mobile viewport included
└── dist/                  # build output → GH Pages via Actions
```

**Isolation rules:** `domain/` imports nothing but its own modules. `data/`
wraps all network access behind small functions taking an injectable `fetch`.
Components render store state and call store/domain functions — no business
logic in `.svelte` files.

## Screens (mobile-first; desktop gets a wider grid layout)

### Dashboard
- Summary cards: total value (₪), monthly profit, yearly profit. Tapping a
  profit card expands an inline breakdown of the calculation (replaces the
  old popovers).
- **New:** portfolio-value-over-time chart, aggregated from every asset's
  `updates` history (converted to ILS).
- Liquidity and investment-type doughnut charts.
- Mobile: single column, stacked charts. Desktop: grid with side-by-side
  charts.

### Assets list
- Card list on mobile: name, current value, type chip, and a small subtle
  staleness dot when the asset hasn't been updated within the configured
  threshold (default 3 months). Unobtrusive by design.
- Filter by type + sort: bottom sheet on mobile, inline controls on desktop.
  Filtered-sum display carries over from the old app.
- Tap a card → Asset detail.

### Asset detail (replaces the edit modal)
- Value history chart, return %, timeline of `updates` entries.
- Actions: edit fields, add an update (date + amount), delete (with
  confirmation).
- Duplicate-name+date prevention and field validation carry over from the
  old app, implemented in `domain/validation`.

### Update round ("Check-in")
- Entry point from Dashboard/Assets: walks through all active assets as a
  single scrollable list of prefilled amount inputs (last known value),
  numeric-keypad-friendly.
- Saves everything at the end as **one commit**.

### Settings
- GitHub token entry, stored in `localStorage`. `?token=` in the URL is still
  accepted for backward compatibility: it is saved to `localStorage` and then
  scrubbed from the URL.
- Investment types config (add/edit types — carries over from the old app).
- Staleness threshold.

## Data & sync

- Load: fetch `data.json` via GitHub Contents API (records the file SHA).
- Save: single commit via Contents API using the recorded SHA; a SHA
  mismatch (edited elsewhere) surfaces a conflict message with a reload
  option instead of silently overwriting.
- Optimistic UI: local state updates immediately; toast on save
  success/failure with retry.
- **Dropped:** GitHub Actions deploy-workflow polling and its progress UI.
  Local state is already correct after a successful save; deploy progress is
  noise.
- Exchange rate: same external USD→ILS rate API, wrapped in `data/` with a
  cached fallback so the app still renders if the rate fetch fails.

## Testing

- **Unit (vitest):** all of `domain/` (profit calc, history aggregation,
  staleness, validation) and `data/` with mocked fetch.
- **Component (vitest + @testing-library/svelte):** key components (asset
  card, update-round form, summary cards).
- **E2E (playwright):** load, add asset, edit, update round, filter/sort —
  against a mocked GitHub API, run in both desktop and mobile viewports.
- CI: existing workflow updated to test → build → deploy `dist/`.

## Deletions at the end

- `app.js`, old `index.html`, `load-env.js`, old `tests/` content replaced.
- `_bmad/` and `_bmad-output/` planning artifacts — **ask Shay before
  deleting these.**

## Out of scope

- Backend/database, multi-currency beyond USD/ILS, push-notification
  reminders (staleness stays a passive visual mark), schema migration.
