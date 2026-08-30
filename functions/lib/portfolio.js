// Assembles the portfolio JSON shape the frontend consumes, from D1.
// See docs/superpowers/specs/2026-08-30-cloudflare-d1-auth-design.md.

const CURRENCIES = ['ILS', 'USD'];
const PROFIT_TYPES = ['price', 'commission', 'other'];

const LATEST_UPDATES_SQL = `
  SELECT u.asset_id, u.date, u.amount FROM asset_updates u
  JOIN (SELECT asset_id, date, MAX(id) AS mid FROM asset_updates GROUP BY asset_id, date) m
    ON u.id = m.mid
  ORDER BY u.asset_id, u.date
`;

/** Fetches the full portfolio: investments (with resolved updates/current_amount) + metadata. */
export async function getPortfolio(db) {
  const [assetsResult, updatesResult, typesResult] = await Promise.all([
    db.prepare('SELECT * FROM assets WHERE deleted_at IS NULL').all(),
    db.prepare(LATEST_UPDATES_SQL).all(),
    db.prepare('SELECT name, exclude_periodical_profit FROM investment_types').all(),
  ]);

  const updatesByAsset = new Map();
  for (const row of updatesResult.results) {
    if (!updatesByAsset.has(row.asset_id)) updatesByAsset.set(row.asset_id, []);
    updatesByAsset.get(row.asset_id).push({ date: row.date, amount: row.amount });
  }

  const investments = assetsResult.results.map((asset) => {
    const updates = updatesByAsset.get(asset.id) || [];
    const current_amount = updates.length > 0 ? updates[updates.length - 1].amount : asset.initial_amount;

    const investment = {
      id: asset.id,
      name: asset.name,
      is_active: !!asset.is_active,
      track_profit: !!asset.track_profit,
      start_date: asset.start_date,
      end_date: null,
      initial_amount: asset.initial_amount,
      currency: asset.currency,
      current_amount,
      profit_type: asset.profit_type,
      notes: asset.notes,
      is_liquid: !!asset.is_liquid,
      investment_type: asset.investment_type,
      liquidity_date: asset.liquidity_date,
      staleness_reminder: !!asset.staleness_reminder,
      updates,
    };

    if (asset.profit_rate !== null && asset.profit_rate !== undefined) {
      investment.profit_rate = asset.profit_rate;
    }

    return investment;
  });

  const metadata = {
    currencies: CURRENCIES,
    profit_types: PROFIT_TYPES,
    investment_types: typesResult.results.map((t) => ({
      name: t.name,
      exclude_periodical_profit: !!t.exclude_periodical_profit,
    })),
  };

  return { investments, metadata };
}
