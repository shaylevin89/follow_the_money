#!/usr/bin/env node
// Fetches /api/portfolio from a deployed (or locally-served) instance using a
// session cookie and compares it against the local data.json to confirm the
// migration preserved everything: non-deleted asset count, per-asset latest
// update amount, and per-asset (deduped-by-date) update count.
//
// Usage: node scripts/verify-migration.mjs <base_url> <session_cookie>
//   base_url        e.g. https://follow-the-money.pages.dev
//   session_cookie  the ftm_session cookie value (no "ftm_session=" prefix needed)

import { readFileSync } from 'node:fs';

/** Dedupes an investment's updates by date, keeping the last occurrence per date (mirrors D1's MAX(id) semantics), and returns them sorted by date. */
function dedupedUpdatesByDate(updates) {
  const byDate = new Map();
  for (const u of updates || []) {
    byDate.set(u.date, u.amount); // last write for a given date wins, same as insertion order
  }
  return [...byDate.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function localAssetSummaries(data) {
  const summaries = new Map();
  for (const investment of data.investments || []) {
    const deduped = dedupedUpdatesByDate(investment.updates);
    const latest = deduped.length > 0 ? deduped[deduped.length - 1].amount : investment.initial_amount;
    summaries.set(investment.id, {
      id: investment.id,
      updateCount: deduped.length,
      latestAmount: latest,
    });
  }
  return summaries;
}

function remoteAssetSummaries(portfolio) {
  const summaries = new Map();
  for (const investment of portfolio.investments || []) {
    const updates = investment.updates || [];
    const latest = updates.length > 0 ? updates[updates.length - 1].amount : investment.initial_amount;
    summaries.set(investment.id, {
      id: investment.id,
      updateCount: updates.length,
      latestAmount: latest,
    });
  }
  return summaries;
}

/**
 * Pure comparison: given the local data.json object and the remote
 * /api/portfolio response body, returns a list of mismatch descriptions.
 * An empty array means the two are equivalent.
 */
export function comparePortfolios(local, remote) {
  const mismatches = [];

  const localSummaries = localAssetSummaries(local);
  const remoteSummaries = remoteAssetSummaries(remote);

  if (localSummaries.size !== remoteSummaries.size) {
    mismatches.push(
      `asset count mismatch: local=${localSummaries.size} remote=${remoteSummaries.size}`
    );
  }

  for (const [id, localSummary] of localSummaries) {
    const remoteSummary = remoteSummaries.get(id);
    if (!remoteSummary) {
      mismatches.push(`asset ${id}: missing from remote portfolio`);
      continue;
    }
    if (localSummary.updateCount !== remoteSummary.updateCount) {
      mismatches.push(
        `asset ${id}: update count mismatch: local=${localSummary.updateCount} remote=${remoteSummary.updateCount}`
      );
    }
    if (localSummary.latestAmount !== remoteSummary.latestAmount) {
      mismatches.push(
        `asset ${id}: latest amount mismatch: local=${localSummary.latestAmount} remote=${remoteSummary.latestAmount}`
      );
    }
  }

  for (const id of remoteSummaries.keys()) {
    if (!localSummaries.has(id)) {
      mismatches.push(`asset ${id}: present in remote but not in local data.json`);
    }
  }

  return mismatches;
}

async function main() {
  const [baseUrl, sessionCookie] = process.argv.slice(2);
  if (!baseUrl || !sessionCookie) {
    process.stderr.write('Usage: node scripts/verify-migration.mjs <base_url> <session_cookie>\n');
    process.exit(1);
  }

  const local = JSON.parse(readFileSync('data.json', 'utf8'));

  const url = new URL('/api/portfolio', baseUrl).toString();
  const response = await fetch(url, {
    headers: { Cookie: `ftm_session=${sessionCookie}` },
  });

  if (!response.ok) {
    process.stderr.write(`FAIL: GET ${url} returned ${response.status}\n`);
    process.exit(1);
  }

  const remote = await response.json();
  const mismatches = comparePortfolios(local, remote);

  if (mismatches.length === 0) {
    console.log('PASS: remote portfolio matches data.json');
    process.exit(0);
  }

  console.log('FAIL: mismatches found');
  console.log('');
  for (const m of mismatches) {
    console.log(`  - ${m}`);
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
