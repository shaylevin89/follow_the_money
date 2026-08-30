import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { applySchema, seedUser, seedAsset, seedUpdate, callFn, getSetCookie } from './helpers.js';
import * as login from '../../functions/api/login.js';
import * as portfolio from '../../functions/api/portfolio.js';

const IP = '5.6.7.8';

function extractSessionToken(setCookie) {
  const match = /ftm_session=([^;]+)/.exec(setCookie || '');
  return match ? match[1] : null;
}

async function loginCookie(env) {
  await seedUser(env.DB, 'shay', 'correct horse battery staple');
  const res = await callFn(login, {
    env,
    ip: IP,
    body: { username: 'shay', password: 'correct horse battery staple' },
  });
  const token = extractSessionToken(getSetCookie(res));
  return `ftm_session=${token}`;
}

describe('GET /api/portfolio', () => {
  beforeAll(() => applySchema(env.DB));

  beforeEach(async () => {
    await env.DB.prepare('DELETE FROM login_attempts').run();
    await env.DB.prepare('DELETE FROM sessions').run();
    await env.DB.prepare('DELETE FROM users').run();
    await env.DB.prepare('DELETE FROM asset_updates').run();
    await env.DB.prepare('DELETE FROM assets').run();
    await env.DB.prepare('DELETE FROM investment_types').run();
  });

  it('returns 401 without a session', async () => {
    const res = await callFn(portfolio, { method: 'GET', env, path: '/api/portfolio' });
    expect(res.status).toBe(401);
  });

  it('returns investments with exact field names and true/false booleans', async () => {
    const cookie = await loginCookie(env);
    await env.DB.prepare(
      'INSERT INTO investment_types (name, exclude_periodical_profit) VALUES (?, ?)'
    )
      .bind('real_estate_loan', 0)
      .run();

    await seedAsset(env.DB, {
      id: 'usa1',
      name: 'USA Real Estate Loan 1',
      investment_type: 'real_estate_loan',
      currency: 'USD',
      start_date: '2017-12-04',
      initial_amount: 35000,
      profit_type: 'commission',
      profit_rate: 6.75,
      is_active: 1,
      is_liquid: 0,
      track_profit: 1,
      staleness_reminder: 0,
      notes: '',
    });
    await seedUpdate(env.DB, 'usa1', '2017-12-04', 35000);

    const res = await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.investments).toHaveLength(1);
    const inv = data.investments[0];
    expect(inv).toEqual({
      id: 'usa1',
      name: 'USA Real Estate Loan 1',
      is_active: true,
      track_profit: true,
      start_date: '2017-12-04',
      end_date: null,
      initial_amount: 35000,
      currency: 'USD',
      current_amount: 35000,
      profit_type: 'commission',
      notes: '',
      is_liquid: false,
      investment_type: 'real_estate_loan',
      liquidity_date: null,
      staleness_reminder: false,
      updates: [{ date: '2017-12-04', amount: 35000 }],
      profit_rate: 6.75,
    });

    expect(data.metadata).toEqual({
      currencies: ['ILS', 'USD'],
      profit_types: ['price', 'commission', 'other'],
      investment_types: [{ name: 'real_estate_loan', exclude_periodical_profit: false }],
    });
  });

  it('omits profit_rate when null', async () => {
    const cookie = await loginCookie(env);
    await seedAsset(env.DB, { id: 'a1', profit_rate: null });
    await seedUpdate(env.DB, 'a1', '2020-01-01', 1000);

    const res = await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' });
    const data = await res.json();
    expect(data.investments[0]).not.toHaveProperty('profit_rate');
  });

  it('uses only the latest row per (asset_id, date), MAX(id) wins', async () => {
    const cookie = await loginCookie(env);
    await seedAsset(env.DB, { id: 'a1', initial_amount: 1000 });
    await seedUpdate(env.DB, 'a1', '2020-01-01', 1000);
    await seedUpdate(env.DB, 'a1', '2020-02-01', 1100);
    // Correction: a second row for the same date; the later-inserted (higher id) row wins.
    await seedUpdate(env.DB, 'a1', '2020-02-01', 1150);

    const res = await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' });
    const data = await res.json();
    const inv = data.investments.find((i) => i.id === 'a1');

    expect(inv.updates).toEqual([
      { date: '2020-01-01', amount: 1000 },
      { date: '2020-02-01', amount: 1150 },
    ]);
    expect(inv.current_amount).toBe(1150);
  });

  it('excludes soft-deleted assets', async () => {
    const cookie = await loginCookie(env);
    await seedAsset(env.DB, { id: 'keep', name: 'Keep me' });
    await seedUpdate(env.DB, 'keep', '2020-01-01', 500);
    await seedAsset(env.DB, { id: 'gone', name: 'Deleted', deleted_at: '2021-01-01T00:00:00.000Z' });
    await seedUpdate(env.DB, 'gone', '2020-01-01', 999);

    const res = await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' });
    const data = await res.json();

    expect(data.investments.map((i) => i.id)).toEqual(['keep']);
  });

  it('falls back current_amount to initial_amount when an asset has no updates', async () => {
    const cookie = await loginCookie(env);
    await seedAsset(env.DB, { id: 'no-updates', initial_amount: 2500 });

    const res = await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' });
    const data = await res.json();
    const inv = data.investments.find((i) => i.id === 'no-updates');

    expect(inv.current_amount).toBe(2500);
    expect(inv.updates).toEqual([]);
  });
});
