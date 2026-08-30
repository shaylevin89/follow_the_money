import { getSessionUser, json } from '../../lib/auth.js';
import { validateAssetFields } from '../../lib/validate.js';

// initial_amount is deliberately excluded: PATCH is settings-fields-only
// (no amounts) — amount changes go through POST /api/updates instead.
const ALLOWED_FIELDS = [
  'name',
  'investment_type',
  'currency',
  'start_date',
  'profit_type',
  'profit_rate',
  'is_active',
  'is_liquid',
  'liquidity_date',
  'track_profit',
  'staleness_reminder',
  'notes',
];

// Fields that, when present in a PATCH body, require re-running full asset
// validation (duplicate name+start_date check, required-field checks, etc.)
// against the merged (existing row + patch) result.
const VALIDATED_FIELDS = ['name', 'start_date', 'investment_type', 'currency', 'profit_type'];

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

  const existing = await env.DB.prepare('SELECT * FROM assets WHERE id = ? AND deleted_at IS NULL')
    .bind(params.id)
    .first();
  if (!existing) return json({ error: 'Not found' }, 404);

  const needsValidation = keys.some((k) => VALIDATED_FIELDS.includes(k));
  let normalized = null;
  if (needsValidation) {
    const merged = { ...existing, ...fields };
    const existingAssets = (
      await env.DB.prepare('SELECT id, name, start_date FROM assets WHERE deleted_at IS NULL AND id != ?')
        .bind(params.id)
        .all()
    ).results;
    const result = validateAssetFields(merged, existingAssets, params.id);
    if (!result.valid) {
      return json({ error: Object.values(result.errors)[0] }, 400);
    }
    normalized = result.normalized;
  }

  const setClauses = [];
  const values = [];
  for (const key of keys) {
    let value = fields[key];
    if (BOOLEAN_FIELDS.has(key)) value = value ? 1 : 0;
    if (key === 'start_date' && normalized) value = normalized.start_date;
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
