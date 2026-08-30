import { SCHEMA } from '../../functions/lib/schema.js';
import { hashPassword } from '../../functions/lib/auth.js';

// Applies the D1 schema to a test database. Grows with more test helpers
// as later tasks add API/auth workers tests.
export async function applySchema(db) {
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(stmt).run();
  }
}

/**
 * Inserts a user with a real PBKDF2 password hash and must_change_password=1
 * (matching how migration-seeded users start out). Returns the new user id.
 */
export async function seedUser(db, username, password) {
  const passwordHash = await hashPassword(password);
  const result = await db
    .prepare('INSERT INTO users (username, password_hash, must_change_password) VALUES (?, ?, 1)')
    .bind(username, passwordHash)
    .run();
  return result.meta.last_row_id;
}

/**
 * Builds a Pages Functions execution context and invokes the matching
 * handler (onRequestPost/onRequestGet) exported by `mod`.
 *
 * @param {object} mod - an `functions/api/*.js` module
 * @param {object} opts
 * @param {'GET'|'POST'} [opts.method='POST']
 * @param {object} [opts.body] - JSON-encoded as the request body
 * @param {string} [opts.cookie] - raw Cookie header value, e.g. 'ftm_session=abc'
 * @param {object} opts.env - the workers `env` (e.g. { DB } from cloudflare:test)
 * @param {string} [opts.ip] - value for the CF-Connecting-IP header
 * @param {string} [opts.path='/api/x'] - request path
 */
export async function callFn(mod, { method = 'POST', body, cookie, env, ip, path = '/api/x' } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (ip) headers['CF-Connecting-IP'] = ip;

  const init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const request = new Request(`https://app.test${path}`, init);
  const context = { request, env, params: {} };

  const handler = method === 'GET' ? mod.onRequestGet : mod.onRequestPost;
  if (!handler) {
    throw new Error(`Module has no onRequest${method === 'GET' ? 'Get' : 'Post'} handler`);
  }
  return handler(context);
}

/** Reads the Set-Cookie header off a Response returned by callFn. */
export function getSetCookie(response) {
  return response.headers.get('Set-Cookie');
}
