import { getSessionUser, json } from '../../lib/auth.js';
import { validateAssetFields } from '../../lib/validate.js';

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  let fields;
  try {
    fields = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!fields || typeof fields !== 'object') {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const existingAssets = (
    await env.DB.prepare('SELECT id, name, start_date FROM assets WHERE deleted_at IS NULL').all()
  ).results;

  const { valid, errors } = validateAssetFields(fields, existingAssets, null);
  if (!valid) {
    return json({ error: Object.values(errors)[0], errors }, 400);
  }

  const id = Date.now().toString();
  const startDate = fields.start_date;
  const initialAmount = Number(fields.initial_amount);
  const isActive = fields.is_active === undefined ? 1 : fields.is_active ? 1 : 0;
  const isLiquid = fields.is_liquid ? 1 : 0;
  const trackProfit = fields.track_profit ? 1 : 0;
  const stalenessReminder = fields.staleness_reminder === undefined ? 1 : fields.staleness_reminder ? 1 : 0;
  const profitRate =
    fields.profit_rate === undefined || fields.profit_rate === null || fields.profit_rate === ''
      ? null
      : Number(fields.profit_rate);
  const liquidityDate = fields.liquidity_date || null;
  const notes = fields.notes || '';

  await env.DB.prepare(
    `INSERT INTO assets
      (id, name, investment_type, currency, start_date, initial_amount, profit_type,
       profit_rate, is_active, is_liquid, liquidity_date, track_profit, staleness_reminder, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      fields.name,
      fields.investment_type,
      fields.currency,
      startDate,
      initialAmount,
      fields.profit_type,
      profitRate,
      isActive,
      isLiquid,
      liquidityDate,
      trackProfit,
      stalenessReminder,
      notes
    )
    .run();

  await env.DB.prepare(
    'INSERT INTO asset_updates (asset_id, date, amount, created_by) VALUES (?, ?, ?, ?)'
  )
    .bind(id, startDate, initialAmount, user.id)
    .run();

  const investment = {
    id,
    name: fields.name,
    is_active: !!isActive,
    track_profit: !!trackProfit,
    start_date: startDate,
    end_date: null,
    initial_amount: initialAmount,
    currency: fields.currency,
    current_amount: initialAmount,
    profit_type: fields.profit_type,
    notes,
    is_liquid: !!isLiquid,
    investment_type: fields.investment_type,
    liquidity_date: liquidityDate,
    staleness_reminder: !!stalenessReminder,
    updates: [{ date: startDate, amount: initialAmount }],
  };
  if (profitRate !== null) investment.profit_rate = profitRate;

  return json(investment);
}
