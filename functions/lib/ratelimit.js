// Login rate limiting: at most MAX_ATTEMPTS failed logins per IP within
// WINDOW_MINUTES, backed by the login_attempts table. Kept separate from
// login.js so the endpoint itself stays thin.

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 10;

function windowStartIso() {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
}

/** Opportunistically deletes login_attempts rows outside the rate-limit window. */
export async function pruneOldAttempts(db) {
  await db.prepare('DELETE FROM login_attempts WHERE attempted_at < ?').bind(windowStartIso()).run();
}

/**
 * Returns true when `ip` has reached or exceeded MAX_ATTEMPTS failed logins
 * within the last WINDOW_MINUTES. Prunes stale rows as a side effect.
 */
export async function isRateLimited(db, ip) {
  await pruneOldAttempts(db);
  const row = await db
    .prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE ip = ? AND attempted_at >= ?')
    .bind(ip, windowStartIso())
    .first();
  return (row?.count ?? 0) >= MAX_ATTEMPTS;
}

/** Records a failed login attempt for `ip`. */
export async function recordFailedAttempt(db, ip) {
  await db
    .prepare('INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)')
    .bind(ip, new Date().toISOString())
    .run();
}

/** Clears all recorded failed attempts for `ip` (called on successful login). */
export async function clearAttempts(db, ip) {
  await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
}
