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
 * @param {object} [opts.params] - Pages Functions dynamic route params, e.g. { id: 'x' }
 */
export async function callFn(
  mod,
  { method = 'POST', body, cookie, env, ip, path = '/api/x', params = {} } = {}
) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (ip) headers['CF-Connecting-IP'] = ip;

  const init = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const request = new Request(`https://app.test${path}`, init);
  const context = { request, env, params };

  const HANDLERS = {
    GET: 'onRequestGet',
    POST: 'onRequestPost',
    PATCH: 'onRequestPatch',
    DELETE: 'onRequestDelete',
  };
  const handlerName = HANDLERS[method];
  const handler = handlerName && mod[handlerName];
  if (!handler) {
    throw new Error(`Module has no ${handlerName || `onRequest for ${method}`} handler`);
  }
  return handler(context);
}

/** Reads the Set-Cookie header off a Response returned by callFn. */
export function getSetCookie(response) {
  return response.headers.get('Set-Cookie');
}

/**
 * Inserts an asset row with sensible defaults for any column not given.
 * @param {object} overrides - e.g. { id, name, investment_type, currency, ... }
 * @returns {Promise<string>} the asset id
 */
export async function seedAsset(db, overrides = {}) {
  const asset = {
    id: 'asset-1',
    name: 'Test Asset',
    investment_type: 'real_estate_loan',
    currency: 'ILS',
    start_date: '2020-01-01',
    initial_amount: 1000,
    profit_type: 'price',
    profit_rate: null,
    is_active: 1,
    is_liquid: 0,
    liquidity_date: null,
    track_profit: 0,
    staleness_reminder: 1,
    notes: '',
    deleted_at: null,
    ...overrides,
  };

  await db
    .prepare(
      `INSERT INTO assets
        (id, name, investment_type, currency, start_date, initial_amount, profit_type,
         profit_rate, is_active, is_liquid, liquidity_date, track_profit, staleness_reminder,
         notes, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      asset.id,
      asset.name,
      asset.investment_type,
      asset.currency,
      asset.start_date,
      asset.initial_amount,
      asset.profit_type,
      asset.profit_rate,
      asset.is_active,
      asset.is_liquid,
      asset.liquidity_date,
      asset.track_profit,
      asset.staleness_reminder,
      asset.notes,
      asset.deleted_at
    )
    .run();

  return asset.id;
}

/** Inserts an asset_updates row (append-only value history). */
export async function seedUpdate(db, assetId, date, amount) {
  const result = await db
    .prepare('INSERT INTO asset_updates (asset_id, date, amount) VALUES (?, ?, ?)')
    .bind(assetId, date, amount)
    .run();
  return result.meta.last_row_id;
}
