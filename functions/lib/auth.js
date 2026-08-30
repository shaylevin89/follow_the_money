// Password hashing, session management, and small HTTP helpers for the
// Pages Functions auth layer. WebCrypto only (no dependencies), matching
// the design in docs/superpowers/specs/2026-08-30-cloudflare-d1-auth-design.md.

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

const SESSION_COOKIE = 'ftm_session';
const SESSION_TTL_DAYS = 90;
const SESSION_REFRESH_THRESHOLD_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

function bytesToBase64(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveBits(password, salt, iterations, lengthBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    lengthBytes * 8
  );
  return new Uint8Array(bits);
}

/** Hashes a password into the storable "iterations$saltB64$hashB64" form. */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS, HASH_BYTES);
  return `${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

/** Constant-time-ish comparison of two byte arrays of equal fixed length. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/** Verifies a password against a stored "iterations$salt$hash" string. */
export async function verifyPassword(password, stored) {
  const parts = typeof stored === 'string' ? stored.split('$') : [];
  if (parts.length !== 3) return false;
  const [iterationsStr, saltB64, hashB64] = parts;
  const iterations = Number(iterationsStr);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  let salt;
  let expectedHash;
  try {
    salt = base64ToBytes(saltB64);
    expectedHash = base64ToBytes(hashB64);
  } catch {
    return false;
  }

  const candidateHash = await deriveBits(password, salt, iterations, expectedHash.length || HASH_BYTES);
  return timingSafeEqual(candidateHash, expectedHash);
}

function randomHexToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Creates a session row for the given user and returns the hex token. */
export async function createSession(db, userId) {
  const token = randomHexToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS).toISOString();
  await db
    .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expiresAt)
    .run();
  return token;
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return part.slice(idx + 1).trim();
  }
  return null;
}

/**
 * Resolves the logged-in user from the session cookie on `request`,
 * sliding the session's expiry forward when fewer than 45 days remain.
 * Returns null when there is no valid, unexpired session.
 */
export async function getSessionUser(db, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const session = await db
    .prepare('SELECT token, user_id, expires_at FROM sessions WHERE token = ?')
    .bind(token)
    .first();
  if (!session) return null;

  const expiresAt = new Date(session.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  const user = await db
    .prepare('SELECT id, username, must_change_password FROM users WHERE id = ?')
    .bind(session.user_id)
    .first();
  if (!user) return null;

  const remainingMs = expiresAt - Date.now();
  if (remainingMs < SESSION_REFRESH_THRESHOLD_DAYS * DAY_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS).toISOString();
    await db.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').bind(newExpiresAt, token).run();
  }

  return {
    id: user.id,
    username: user.username,
    must_change_password: user.must_change_password,
  };
}

/** Deletes the session referenced by the request's cookie, if any. */
export async function destroySession(db, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

/** Builds a Set-Cookie value that establishes a session. */
export function sessionCookie(token) {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

/** Builds a Set-Cookie value that clears the session cookie. */
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

/** Small helper for consistent JSON Response construction. */
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}
