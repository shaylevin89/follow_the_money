import { getSessionUser, json } from '../lib/auth.js';
import { getPortfolio } from '../lib/portfolio.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not authenticated' }, 401);
  return json(await getPortfolio(env.DB));
}
