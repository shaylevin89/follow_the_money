import { getSessionUser, json } from '../../lib/auth.js';

const ALLOWED_FIELDS = [
  'name',
  'investment_type',
  'currency',
  'start_date',
  'initial_amount',
  'profit_type',
  'profit_rate',
  'is_active',
  'is_liquid',
  'liquidity_date',
  'track_profit',
  'staleness_reminder',
  'notes',
];

const BOOLEAN_FIELDS = new Set(['is_active', 'is_liquid', 'track_profit', 'staleness_reminder']);

export async function onRequestPatch({ request, env, params }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  let fields;
  try {
    fields = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const keys = Object.keys(fields);
  const disallowed = keys.filter((k) => !ALLOWED_FIELDS.includes(k));
  if (disallowed.length > 0) {
    return json({ error: `Field(s) not allowed: ${disallowed.join(', ')}` }, 400);
  }
  if (keys.length === 0) {
    return json({ error: 'No fields to update' }, 400);
  }

  const existing = await env.DB.prepare('SELECT id FROM assets WHERE id = ? AND deleted_at IS NULL')
    .bind(params.id)
    .first();
  if (!existing) return json({ error: 'Not found' }, 404);

  const setClauses = [];
  const values = [];
  for (const key of keys) {
    let value = fields[key];
    if (BOOLEAN_FIELDS.has(key)) value = value ? 1 : 0;
    setClauses.push(`${key} = ?`);
    values.push(value);
  }
  values.push(params.id);

  await env.DB.prepare(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const existing = await env.DB.prepare('SELECT id FROM assets WHERE id = ? AND deleted_at IS NULL')
    .bind(params.id)
    .first();
  if (!existing) return json({ error: 'Not found' }, 404);

  await env.DB.prepare("UPDATE assets SET deleted_at = datetime('now') WHERE id = ?").bind(params.id).run();

  return json({ ok: true });
}
