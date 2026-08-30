import { verifyPassword, createSession, sessionCookie, json } from '../lib/auth.js';
import { isRateLimited, recordFailedAttempt, clearAttempts } from '../lib/ratelimit.js';

const INVALID = { error: 'Invalid username or password' };

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Rate limit check happens before touching credentials at all, per spec:
  // even a correct password is rejected once the IP is over the limit.
  if (await isRateLimited(db, ip)) {
    return json({ error: 'Too many failed attempts. Try again later.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const username = body && typeof body.username === 'string' ? body.username : '';
  const password = body && typeof body.password === 'string' ? body.password : '';

  const user = username
    ? await db
        .prepare('SELECT id, username, password_hash, must_change_password FROM users WHERE username = ?')
        .bind(username)
        .first()
    : null;

  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  if (!valid) {
    await recordFailedAttempt(db, ip);
    return json(INVALID, 401);
  }

  await clearAttempts(db, ip);
  const token = await createSession(db, user.id);
  return json(
    { ok: true, mustChangePassword: !!user.must_change_password },
    200,
    { 'Set-Cookie': sessionCookie(token) }
  );
}
