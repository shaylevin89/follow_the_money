# Follow the Money

A personal investment portfolio tracker. Mobile-first Svelte app, hosted as a
static site, with your data stored as `data.json` in this repository — every
change is a git commit, so you get full history for free.

## Features

- **Dashboard** — total value (₪), monthly/yearly profit with tap-to-expand
  calculation breakdowns, portfolio-value-over-time chart, liquidity and
  per-type charts.
- **Assets** — filter/sort your investments, subtle staleness dots for assets
  that haven't been updated in a while, per-asset detail with value history
  chart, return %, and update timeline.
- **Check-in** — walk over all active assets once a month, type the new
  values, and save everything as a single commit.
- **Settings** — GitHub token, staleness threshold, investment types.

## How it works

The app is a static bundle (GitHub Pages / Cloudflare Pages). It reads and
writes `data.json` in this repo through the GitHub Contents API using a
personal access token that is stored **only in your browser's localStorage**.
Conflicts (edits from two devices) are detected via the file SHA and surfaced
with a reload prompt instead of overwriting.

## Setup

1. Create a fine-grained GitHub personal access token with read/write access
   to this repository's contents.
2. Open the deployed app and paste the token when asked. Done.

Legacy `?token=<PAT>` URLs still work: the token is adopted into localStorage
and scrubbed from the URL.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm test           # unit tests (vitest)
npm run test:e2e   # e2e tests (playwright, mocked GitHub API)
```

### Structure

```
src/
├── lib/
│   ├── domain/     # pure logic: profit, history, validation, staleness…
│   ├── data/       # GitHub Contents API, exchange rates, token storage
│   ├── stores/     # portfolio / settings / ui stores
│   ├── components/ # reusable UI components
│   └── charts.js   # Chart.js config builders (pure)
└── views/          # Dashboard, Assets, AssetDetail, CheckIn, Settings
```

`domain/` and `data/` are plain modules with no DOM or Svelte imports; all
network access goes through an injectable `fetch`, which is what the unit
tests mock.

## Deployment

- **GitHub Pages**: `.github/workflows/static.yml` builds and deploys `dist/`
  on push to `main`. Commits that only touch `data.json` do **not** trigger a
  deploy (the app reads data via the API, so a redeploy would be wasted
  runner minutes).
- **Cloudflare Pages**: create a Pages project with build command
  `npm run build` and output directory `dist`. The bundle uses relative paths
  (`base: './'`), so no extra configuration is needed.

## Data format

`data.json` at the repo root:

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
