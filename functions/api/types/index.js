import { getSessionUser, json } from '../../lib/auth.js';

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

  const name = typeof fields.name === 'string' ? fields.name.trim() : '';
  if (!name) {
    return json({ error: 'Name is required' }, 400);
  }

  const existing = await env.DB.prepare(
    'SELECT name FROM investment_types WHERE LOWER(name) = LOWER(?)'
  )
    .bind(name)
    .first();
  if (existing) {
    return json({ error: 'A type with this name already exists' }, 409);
  }

  const excludePeriodicalProfit = fields.exclude_periodical_profit ? 1 : 0;

  await env.DB.prepare(
    'INSERT INTO investment_types (name, exclude_periodical_profit) VALUES (?, ?)'
  )
    .bind(name, excludePeriodicalProfit)
    .run();

  return json({ name, exclude_periodical_profit: !!excludePeriodicalProfit });
}
