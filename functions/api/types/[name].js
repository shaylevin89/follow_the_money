import { getSessionUser, json } from '../../lib/auth.js';

export async function onRequestPatch({ request, env, params }) {
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

  const existing = await env.DB.prepare('SELECT name FROM investment_types WHERE name = ?')
    .bind(params.name)
    .first();
  if (!existing) return json({ error: 'Not found' }, 404);

  const excludePeriodicalProfit = fields.exclude_periodical_profit ? 1 : 0;

  await env.DB.prepare('UPDATE investment_types SET exclude_periodical_profit = ? WHERE name = ?')
    .bind(excludePeriodicalProfit, params.name)
    .run();

  return json({ ok: true });
}
