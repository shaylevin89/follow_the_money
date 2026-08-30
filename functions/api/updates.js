import { getSessionUser, json } from '../lib/auth.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  let items;
  try {
    items = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'Body must be a non-empty array' }, 400);
  }

  const assetRows = (await env.DB.prepare('SELECT id FROM assets WHERE deleted_at IS NULL').all()).results;
  const validAssetIds = new Set(assetRows.map((r) => r.id));

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return json({ error: 'Each update must be an object' }, 400);
    }
    const { asset_id, date, amount } = item;
    if (!asset_id || !validAssetIds.has(asset_id)) {
      return json({ error: `Unknown asset_id: ${asset_id}` }, 400);
    }
    if (typeof date !== 'string' || !DATE_RE.test(date)) {
      return json({ error: `Invalid date: ${date}` }, 400);
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < 0) {
      return json({ error: `Invalid amount: ${amount}` }, 400);
    }
  }

  const statements = items.map((item) =>
    env.DB.prepare('INSERT INTO asset_updates (asset_id, date, amount, created_by) VALUES (?, ?, ?, ?)').bind(
      item.asset_id,
      item.date,
      Number(item.amount),
      user.id
    )
  );
  await env.DB.batch(statements);

  return json({ inserted: items.length });
}
