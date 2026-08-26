# Follow the Money — Svelte Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the investment tracker as a mobile-first Vite + Svelte static app with a pure, tested domain layer, keeping the exact `data.json` schema and GitHub-API persistence.

**Architecture:** Pure JS domain modules (no DOM imports) + a thin data layer wrapping GitHub Contents API and the exchange-rate API with injectable `fetch` + Svelte 5 stores + thin components. Client-side view switching (no router lib). Chart.js for charts.

**Tech Stack:** Vite, Svelte 5, Chart.js, Vitest (+ @testing-library/svelte), Playwright.

**Spec:** `docs/superpowers/specs/2026-08-26-svelte-rewrite-design.md`

## Global Constraints

- `data.json` stays at repo root, schema unchanged; additive fields only. **Never lose or rewrite existing investment data.**
- Static bundle must work on GitHub Pages AND Cloudflare Pages → `base: './'` in vite config, no absolute asset paths.
- Repo constants: owner `shaylevin89`, repo `follow_the_money`, file `data.json`.
- All domain/data modules: no DOM, no Svelte imports, `fetch` injectable.
- Currency handling: ILS native, USD converted at current rate; fallback rate 3.65.
- Mobile-first CSS; touch targets ≥ 44px.
- TDD: every domain/data module gets its test written first.
- Old app files (`app.js`, old `index.html`, `load-env.js`, old tests) are deleted only in the final task, after e2e parity.

---

### Task 1: Scaffold Vite + Svelte project

**Files:**
- Create: `vite.config.js`, `svelte.config.js`, `index.html` (new, replaces old — old moved to `legacy/`), `src/main.js`, `src/App.svelte`, `src/app.css`
- Modify: `package.json` (add deps + scripts), `.gitignore` (add `dist/`), `vitest.config.js`
- Move: `index.html` → `legacy/index.html`, `app.js` → `legacy/app.js`, `load-env.js` → `legacy/load-env.js`, `tests/` → `legacy/tests/`

**Interfaces:**
- Produces: `npm run dev`, `npm run build` (outputs `dist/`), `npm test` running vitest against `tests/unit/**`.

Steps:
- [ ] Move old app into `legacy/` (git mv) and commit.
- [ ] `npm install -D vite @sveltejs/vite-plugin-svelte svelte @testing-library/svelte @testing-library/jest-dom chart.js` (chart.js as dependency, not dev).
- [ ] Write `vite.config.js` with `base: './'`, svelte plugin, and vitest config (jsdom, `tests/unit/**/*.test.js`). Delete standalone `vitest.config.js` (merge into vite config).
- [ ] Minimal `index.html` + `src/main.js` + `src/App.svelte` rendering "Follow the Money".
- [ ] Verify: `npm run build` succeeds; `npm test` passes with a placeholder smoke test.
- [ ] Commit.

### Task 2: Schema fixtures + domain/investments

**Files:**
- Create: `src/lib/domain/investments.js`, `tests/unit/fixtures/sample-data.js`, `tests/unit/investments.test.js`

**Interfaces:**
- Produces: `isLoanType(type)`, `normalizeDate(date)`, `findDuplicate(investments, name, startDate, excludeId=null)`, `currentAmount(inv)` (current_amount ?? initial_amount), `activeInvestments(investments)`, `lastUpdate(inv)` → `{date, amount}|null` (latest by date).

Steps (TDD): failing tests → implement (port from `legacy/app.js:32-76`) → pass → commit.

### Task 3: domain/money

**Files:** Create `src/lib/domain/money.js`, `tests/unit/money.test.js`

**Interfaces:**
- Produces: `toIls(amount, currency, usdToIlsRate)` (ILS passthrough, USD × rate, unknown → 0), `formatNumber(n)` (Intl en-US, 0 fraction digits), `totalValueIls(investments, rate)` (active only, ported from `legacy/app.js:1644-1652`).

Steps: TDD as above; commit.

### Task 4: domain/profit — faithful port

**Files:** Create `src/lib/domain/profit.js`, `tests/unit/profit.test.js`

**Interfaces:**
- Produces: `profitBreakdown(investments, metadata, usdToIlsRate, periodDays, now)` → `{ total, details: [{name, type, currency, calculation, profit}] }`. `periodDays` is 30 (monthly) or 365 (yearly). `now` is an injected Date.

Port rules exactly from `legacy/app.js:1656-1793`, generalized over periodDays:
- Consider only active + `track_profit` + type not in `metadata.investment_types[].exclude_periodical_profit`.
- Loan types with numeric `profit_rate`: `amount × rate% × min(daysSinceStart, periodDays)/periodDays` scaled to period (monthly = /12 of annual). Calculation string matches legacy format.
- Else, if ≥2 updates: sort by date, (last−first); if elapsed days ≥ periodDays … pro-rate `change/days × periodDays`; if 0 < days < periodDays use raw change; days ≤ 0 → 0.
- USD → × rate, appended to calculation string.

Tests must cover: loan pro-rating before/after periodDays, updates-based both branches, exclusion by metadata, USD conversion, skip when <2 updates and no rate.

Steps: TDD; commit.

### Task 5: domain/history (portfolio over time) + staleness

**Files:** Create `src/lib/domain/history.js`, `src/lib/domain/staleness.js`, `tests/unit/history.test.js`, `tests/unit/staleness.test.js`

**Interfaces:**
- Produces: `portfolioHistory(investments, usdToIlsRate)` → sorted `[{date: 'YYYY-MM-DD', total}]`: union of all update dates across ALL investments; per date, each investment contributes its most recent update ≤ date (0 before first update), converted to ILS.
- `assetHistory(inv, usdToIlsRate)` → `[{date, amount, amountIls}]` sorted.
- `isStale(inv, thresholdMonths, now)` → true when latest update (or start_date if none) older than threshold months; only meaningful for active investments.

Steps: TDD; commit.

### Task 6: domain/validation + filters/sort

**Files:** Create `src/lib/domain/validation.js`, `src/lib/domain/filters.js`, `tests/unit/validation.test.js`, `tests/unit/filters.test.js`

**Interfaces:**
- Produces: `validateInvestment(fields, investments, excludeId)` → `{ valid, errors: {field: message} }` — required: name, investment_type, initial_amount (>0 number), currency, start_date (valid, not future), profit_type; duplicate name+start_date via findDuplicate.
- `filterByTypes(investments, types)` (empty types → all), `sortInvestments(investments, by, dir)` with by ∈ `name|current_amount|start_date|investment_type`, `sumIls(investments, rate)`.

Steps: TDD; commit.

### Task 7: data layer — GitHub client, rates, token

**Files:** Create `src/lib/data/github.js`, `src/lib/data/rates.js`, `src/lib/data/token.js`, `tests/unit/github.test.js`, `tests/unit/rates.test.js`, `tests/unit/token.test.js`

**Interfaces:**
- `createGithubClient({owner, repo, path, token, fetchFn})` →
  - `load()` → `{data, sha}` via `GET /repos/{o}/{r}/contents/{path}` (decode base64 UTF-8-safely; on >1MB fallback: take `sha` from contents response, fetch content via `download_url`).
  - `save(data, sha)` → `{sha}` via PUT with commit message `Update investment data`; 409/422-sha-mismatch → throw `ConflictError` (exported class).
- `getUsdToIlsRate({fetchFn, storage})` → number; on success cache `{rate, ts}` in storage key `ftm_usd_ils`; on failure return cached, else 3.65.
- `getToken({storage, location, history})` → reads `ftm_github_token` from storage; else `?token=` URL param → persist + scrub URL via `history.replaceState`; `setToken(storage, value)`, `clearToken(storage)`.

Steps: TDD with mocked fetch/storage; test conflict path and base64 unicode round-trip; commit.

### Task 8: stores

**Files:** Create `src/lib/stores/portfolio.js`, `src/lib/stores/settings.js`, `src/lib/stores/ui.js`, `tests/unit/portfolio-store.test.js`

**Interfaces:**
- `settings.js`: `settings` writable persisted to localStorage (`ftm_settings`): `{ stalenessMonths: 3 }`; token handled via token.js helpers exposed as `token` writable.
- `ui.js`: `view` writable `{name: 'dashboard'|'assets'|'asset'|'checkin'|'settings', params}` + `navigate(name, params)`; `toasts` writable + `toast(message, kind)` auto-dismiss.
- `portfolio.js`: state `{ data, sha, loading, saving, error, conflict }` with actions (all pure updates + `save()` through injected client):
  - `init(client)`, `load()`
  - `addInvestment(fields)` → id = `Date.now().toString()`, seeds `updates:[{date:start_date, amount:initial_amount}]`
  - `updateInvestment(id, fields)`, `deleteInvestment(id)`
  - `addUpdate(id, {date, amount})` → appends (replaces same-date entry), sets `current_amount`
  - `applyCheckIn([{id, date, amount}])` → bulk addUpdate, **single save/commit**
  - `addType(name, exclude)`, `updateType(idx, fields)`
  - every mutating action sets `lastUpdated`, calls `save()`; on ConflictError → set `conflict: true` (UI offers reload)
- Store tests use a fake client; assert single save per check-in, conflict flag, update-replacement on same date.

Steps: TDD; commit.

### Task 9: App shell, navigation, design system

**Files:** Create `src/app.css` (design tokens), `src/lib/components/NavBar.svelte`, `src/lib/components/Toasts.svelte`, `src/lib/components/TokenGate.svelte`, modify `src/App.svelte`, `src/main.js`

Design: CSS custom properties (light+dark via prefers-color-scheme), system font stack, bottom tab bar on mobile (Dashboard/Assets/Check-in/Settings), top bar on ≥768px. TokenGate shows token entry screen when no token. App loads data on token availability.

Steps: build; component test for TokenGate (shows form when no token, slot when token); visual check via `npm run dev` + playwright screenshot; commit.

### Task 10: Dashboard view

**Files:** Create `src/views/Dashboard.svelte`, `src/lib/components/SummaryCard.svelte`, `src/lib/components/ProfitBreakdown.svelte`, `src/lib/components/ChartCard.svelte` (wraps Chart.js with lifecycle), `src/lib/charts.js` (chart config builders — pure, unit-testable)

**Interfaces:**
- `charts.js` produces: `portfolioHistoryConfig(points)`, `liquidityConfig(investments, rate)` (liquid vs non-liquid doughnut, ported grouping), `typeConfig(investments, rate)` (by investment_type doughnut).

Content: 3 summary cards (total ₪, monthly, yearly). Tap profit card → inline expandable breakdown list (name, calculation, ₪) replacing legacy popovers. Portfolio-history line chart, liquidity + type doughnuts. Mobile single column.

Steps: unit tests for `charts.js` builders; component render test for Dashboard with fixture data; commit.

### Task 11: Assets list view

**Files:** Create `src/views/Assets.svelte`, `src/lib/components/AssetCard.svelte`, `src/lib/components/FilterSheet.svelte`

Content: cards (name, value ₪ + native currency, type chip, inactive badge, subtle staleness dot via `isStale`), filter-by-type + sort controls (bottom sheet on mobile, inline row on desktop), filtered-sum line when filters active, FAB "+" to add asset (opens AssetDetail in create mode), tap card → `navigate('asset', {id})`.

Steps: component tests (filtering, staleness dot, filtered sum); commit.

### Task 12: Asset detail view (create/edit/updates/delete)

**Files:** Create `src/views/AssetDetail.svelte`, `src/lib/components/AssetForm.svelte`, `src/lib/components/UpdateTimeline.svelte`

Content: for existing asset — value history chart (assetHistory), return % (last vs initial), timeline of updates, "Add update" (date defaults today + amount), edit form (all legacy fields: name, type, currency, amounts, dates, profit_type, profit_rate for loans, is_active, is_liquid, liquidity_date, track_profit, notes), delete with confirm. Create mode: empty AssetForm. Validation via `validateInvestment`, inline errors.

Steps: component tests (validation errors shown, duplicate blocked, add-update flows to store); commit.

### Task 13: Check-in (update round) + Settings views

**Files:** Create `src/views/CheckIn.svelte`, `src/views/Settings.svelte`

CheckIn: scrollable list of ALL active assets, each with prefilled numeric input (`inputmode="decimal"`, last amount), date defaults today, skip allowed (unchanged input = skipped), single "Save all" → `applyCheckIn` (one commit), summary toast.
Settings: token management (masked, replace/clear), staleness threshold, investment types config (add/edit name + exclude_periodical_profit flag).

Steps: component tests (only changed values submitted, single save call); commit.

### Task 14: E2E tests (Playwright, mocked GitHub)

**Files:** Create `tests/e2e/app.spec.js`, `tests/e2e/mocks.js`, modify `playwright.config.js` (vite preview server, projects: desktop chromium + mobile Pixel 7)

Mock via `page.route`: `api.github.com/repos/**/contents/data.json` GET (fixture) & PUT (capture body, return new sha), exchange-rate API. Flows: token gate → dashboard renders totals; assets list + filter; add asset; edit asset; add update; check-in round commits once with all changed amounts (assert PUT body); conflict path shows reload prompt.

Steps: write specs, run `npm run test:e2e` both projects green; commit.

### Task 15: CI/CD + cleanup

**Files:** Modify `.github/workflows/test.yml` (unit + e2e on push/PR), Create `.github/workflows/deploy.yml` (build → actions/deploy-pages, `paths-ignore: ['data.json', '**.md']` so data saves don't burn runner minutes), Delete: `legacy/`, `_bmad/`, `_bmad-output/` (ask user first for _bmad), update `README.md`.

Steps: run full `npm run test:all`; verify `dist/` build; update README (new setup, token in localStorage, Cloudflare Pages note: build command `npm run build`, output `dist`); commit; push and watch Actions run; report GHA runner-minutes usage to user if limits hit.

---

## Self-review notes

- Spec coverage: all screens (T9–13), history chart (T5/T10), staleness (T5/T11), single-commit check-in (T8/T13/T14), conflict SHA handling (T7/T8/T14), token localStorage + URL scrub (T7/T9), drop workflow polling (nothing implements it — confirmed), Cloudflare compat (T1 base './', T15 README), deletions (T15).
- Types consistent: `currentAmount`, `profitBreakdown`, `applyCheckIn`, `ConflictError` used uniformly.
