import { getSessionUser, json } from '../lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(env.DB, request);
  if (!user) return json({ error: 'Not authenticated' }, 401);
  return json({ username: user.username, mustChangePassword: !!user.must_change_password });
}
