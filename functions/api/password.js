import { getSessionUser, verifyPassword, hashPassword, json } from '../lib/auth.js';

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  const user = await getSessionUser(db, request);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const current = body && typeof body.current === 'string' ? body.current : '';
  const next = body && typeof body.next === 'string' ? body.next : '';

  if (next.length < 8) {
    return json({ error: 'New password must be at least 8 characters' }, 400);
  }

  const row = await db.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first();
  const valid = row ? await verifyPassword(current, row.password_hash) : false;
  if (!valid) {
    return json({ error: 'Current password is incorrect' }, 401);
  }

  const newHash = await hashPassword(next);
  await db
    .prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?')
    .bind(newHash, user.id)
    .run();

  return json({ ok: true });
}
