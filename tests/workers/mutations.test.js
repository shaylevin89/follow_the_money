import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { applySchema, seedUser, seedAsset, seedUpdate, callFn, getSetCookie } from './helpers.js';
import * as login from '../../functions/api/login.js';
import * as portfolio from '../../functions/api/portfolio.js';
import * as assetsIndex from '../../functions/api/assets/index.js';
import * as assetsId from '../../functions/api/assets/[id].js';
import * as updates from '../../functions/api/updates.js';
import * as typesIndex from '../../functions/api/types/index.js';
import * as typesName from '../../functions/api/types/[name].js';

const IP = '9.9.9.9';

function extractSessionToken(setCookie) {
  const match = /ftm_session=([^;]+)/.exec(setCookie || '');
  return match ? match[1] : null;
}

async function loginCookie(env, username = 'shay') {
  await seedUser(env.DB, username, 'correct horse battery staple');
  const res = await callFn(login, {
    env,
    ip: IP,
    body: { username, password: 'correct horse battery staple' },
  });
  const token = extractSessionToken(getSetCookie(res));
  return `ftm_session=${token}`;
}

async function countUpdates(env, assetId) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS c FROM asset_updates WHERE asset_id = ?')
    .bind(assetId)
    .first();
  return row.c;
}

describe('mutation endpoints', () => {
  beforeAll(() => applySchema(env.DB));

  beforeEach(async () => {
    await env.DB.prepare('DELETE FROM login_attempts').run();
    await env.DB.prepare('DELETE FROM sessions').run();
    await env.DB.prepare('DELETE FROM asset_updates').run();
    await env.DB.prepare('DELETE FROM assets').run();
    await env.DB.prepare('DELETE FROM users').run();
    await env.DB.prepare('DELETE FROM investment_types').run();
  });

  describe('POST /api/assets', () => {
    it('401 without session', async () => {
      const res = await callFn(assetsIndex, { env, path: '/api/assets', body: {} });
      expect(res.status).toBe(401);
    });

    it('creates an asset and it appears in the portfolio with a seeded first update', async () => {
      const cookie = await loginCookie(env);
      const res = await callFn(assetsIndex, {
        env,
        cookie,
        path: '/api/assets',
        body: {
          name: 'New Asset',
          investment_type: 'real_estate_loan',
          currency: 'USD',
          start_date: '2022-01-01',
          initial_amount: 5000,
          profit_type: 'price',
        },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe('New Asset');
      expect(body.current_amount).toBe(5000);
      expect(body.updates).toEqual([{ date: '2022-01-01', amount: 5000 }]);
      expect(typeof body.id).toBe('string');

      const port = await (await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' })).json();
      const found = port.investments.find((i) => i.id === body.id);
      expect(found).toBeTruthy();
      expect(found.updates).toEqual([{ date: '2022-01-01', amount: 5000 }]);
    });

    it('400 on duplicate name + start_date among non-deleted assets', async () => {
      const cookie = await loginCookie(env);
      await seedAsset(env.DB, { id: 'dup1', name: 'Dup Asset', start_date: '2021-01-01' });
      const res = await callFn(assetsIndex, {
        env,
        cookie,
        path: '/api/assets',
        body: {
          name: 'Dup Asset',
          investment_type: 'real_estate_loan',
          currency: 'USD',
          start_date: '2021-01-01',
          initial_amount: 100,
          profit_type: 'price',
        },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });

    it('400 on missing required fields / non-positive amount / future date', async () => {
      const cookie = await loginCookie(env);
      const res = await callFn(assetsIndex, {
        env,
        cookie,
        path: '/api/assets',
        body: { name: '', investment_type: '', currency: '', profit_type: '', initial_amount: -5 },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/assets/:id', () => {
    it('401 without session', async () => {
      const res = await callFn(assetsId, {
        env,
        method: 'PATCH',
        path: '/api/assets/x',
        params: { id: 'x' },
        body: {},
      });
      expect(res.status).toBe(401);
    });

    it('changes settings without touching asset_updates', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'p1', name: 'Original', notes: '' });
      await seedUpdate(env.DB, id, '2020-01-01', 1000);
      const before = await countUpdates(env, id);

      const res = await callFn(assetsId, {
        env,
        cookie,
        method: 'PATCH',
        path: `/api/assets/${id}`,
        params: { id },
        body: { name: 'Renamed', notes: 'hello' },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ ok: true });

      const after = await countUpdates(env, id);
      expect(after).toBe(before);

      const row = await env.DB.prepare('SELECT name, notes FROM assets WHERE id = ?').bind(id).first();
      expect(row.name).toBe('Renamed');
      expect(row.notes).toBe('hello');
    });

    it('400 when body contains a disallowed key like amount', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'p2' });
      const res = await callFn(assetsId, {
        env,
        cookie,
        method: 'PATCH',
        path: `/api/assets/${id}`,
        params: { id },
        body: { amount: 999 },
      });
      expect(res.status).toBe(400);
    });

    it('404 for unknown or deleted id', async () => {
      const cookie = await loginCookie(env);
      const res = await callFn(assetsId, {
        env,
        cookie,
        method: 'PATCH',
        path: `/api/assets/nope`,
        params: { id: 'nope' },
        body: { name: 'x' },
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('401 without session', async () => {
      const res = await callFn(assetsId, {
        env,
        method: 'DELETE',
        path: '/api/assets/x',
        params: { id: 'x' },
      });
      expect(res.status).toBe(401);
    });

    it('soft-deletes: excluded from portfolio, row remains in table', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'd1' });
      await seedUpdate(env.DB, id, '2020-01-01', 1000);

      const res = await callFn(assetsId, {
        env,
        cookie,
        method: 'DELETE',
        path: `/api/assets/${id}`,
        params: { id },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ ok: true });

      const row = await env.DB.prepare('SELECT deleted_at FROM assets WHERE id = ?').bind(id).first();
      expect(row.deleted_at).toBeTruthy();

      const port = await (await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' })).json();
      expect(port.investments.find((i) => i.id === id)).toBeUndefined();
    });

    it('404 for unknown or already-deleted id', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'd2' });
      await callFn(assetsId, { env, cookie, method: 'DELETE', path: `/api/assets/${id}`, params: { id } });
      const res = await callFn(assetsId, { env, cookie, method: 'DELETE', path: `/api/assets/${id}`, params: { id } });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/updates', () => {
    it('401 without session', async () => {
      const res = await callFn(updates, { env, path: '/api/updates', body: [] });
      expect(res.status).toBe(401);
    });

    it('appends rows; same date twice yields two rows, portfolio shows latest', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'u1' });
      await seedUpdate(env.DB, id, '2020-01-01', 1000);

      const res = await callFn(updates, {
        env,
        cookie,
        path: '/api/updates',
        body: [
          { asset_id: id, date: '2023-01-01', amount: 2000 },
          { asset_id: id, date: '2023-01-01', amount: 2500 },
        ],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ inserted: 2 });

      const count = await countUpdates(env, id);
      expect(count).toBe(3);

      const port = await (await callFn(portfolio, { method: 'GET', env, cookie, path: '/api/portfolio' })).json();
      const found = port.investments.find((i) => i.id === id);
      expect(found.current_amount).toBe(2500);
    });

    it('accepts a zero amount', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'u2' });
      const res = await callFn(updates, {
        env,
        cookie,
        path: '/api/updates',
        body: [{ asset_id: id, date: '2023-05-05', amount: 0 }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ inserted: 1 });
    });

    it('400 on negative amount', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'u3' });
      const res = await callFn(updates, {
        env,
        cookie,
        path: '/api/updates',
        body: [{ asset_id: id, date: '2023-05-05', amount: -1 }],
      });
      expect(res.status).toBe(400);
    });

    it('400 on unknown asset_id', async () => {
      const cookie = await loginCookie(env);
      const res = await callFn(updates, {
        env,
        cookie,
        path: '/api/updates',
        body: [{ asset_id: 'nope', date: '2023-05-05', amount: 10 }],
      });
      expect(res.status).toBe(400);
    });

    it('400 on non-array or empty body', async () => {
      const cookie = await loginCookie(env);
      const res1 = await callFn(updates, { env, cookie, path: '/api/updates', body: { not: 'array' } });
      expect(res1.status).toBe(400);
      const res2 = await callFn(updates, { env, cookie, path: '/api/updates', body: [] });
      expect(res2.status).toBe(400);
    });

    it('400 on bad date format', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'u4' });
      const res = await callFn(updates, {
        env,
        cookie,
        path: '/api/updates',
        body: [{ asset_id: id, date: '05/05/2023', amount: 10 }],
      });
      expect(res.status).toBe(400);
    });

    it('is all-or-nothing: a bad row prevents any inserts', async () => {
      const cookie = await loginCookie(env);
      const id = await seedAsset(env.DB, { id: 'u5' });
      const before = await countUpdates(env, id);
      const res = await callFn(updates, {
        env,
        cookie,
        path: '/api/updates',
        body: [
          { asset_id: id, date: '2023-05-05', amount: 10 },
          { asset_id: id, date: '2023-05-06', amount: -1 },
        ],
      });
      expect(res.status).toBe(400);
      const after = await countUpdates(env, id);
      expect(after).toBe(before);
    });
  });

  describe('POST /api/types', () => {
    it('401 without session', async () => {
      const res = await callFn(typesIndex, { env, path: '/api/types', body: {} });
      expect(res.status).toBe(401);
    });

    it('creates a type', async () => {
      const cookie = await loginCookie(env);
      const res = await callFn(typesIndex, {
        env,
        cookie,
        path: '/api/types',
        body: { name: 'crypto', exclude_periodical_profit: true },
      });
      expect(res.status).toBe(200);
      const row = await env.DB.prepare('SELECT * FROM investment_types WHERE name = ?').bind('crypto').first();
      expect(row).toBeTruthy();
      expect(row.exclude_periodical_profit).toBe(1);
    });

    it('409 on duplicate name, case-insensitive', async () => {
      const cookie = await loginCookie(env);
      await callFn(typesIndex, { env, cookie, path: '/api/types', body: { name: 'Crypto', exclude_periodical_profit: false } });
      const res = await callFn(typesIndex, {
        env,
        cookie,
        path: '/api/types',
        body: { name: 'crypto', exclude_periodical_profit: false },
      });
      expect(res.status).toBe(409);
    });

    it('400 on empty name', async () => {
      const cookie = await loginCookie(env);
      const res = await callFn(typesIndex, { env, cookie, path: '/api/types', body: { name: '' } });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/types/:name', () => {
    it('401 without session', async () => {
      const res = await callFn(typesName, {
        env,
        method: 'PATCH',
        path: '/api/types/x',
        params: { name: 'x' },
        body: {},
      });
      expect(res.status).toBe(401);
    });

    it('updates exclude_periodical_profit', async () => {
      const cookie = await loginCookie(env);
      await callFn(typesIndex, { env, cookie, path: '/api/types', body: { name: 'bonds', exclude_periodical_profit: false } });
      const res = await callFn(typesName, {
        env,
        cookie,
        method: 'PATCH',
        path: '/api/types/bonds',
        params: { name: 'bonds' },
        body: { exclude_periodical_profit: true },
      });
      expect(res.status).toBe(200);
      const row = await env.DB.prepare('SELECT exclude_periodical_profit FROM investment_types WHERE name = ?').bind('bonds').first();
      expect(row.exclude_periodical_profit).toBe(1);
    });

    it('404 for unknown type', async () => {
      const cookie = await loginCookie(env);
      const res = await callFn(typesName, {
        env,
        cookie,
        method: 'PATCH',
        path: '/api/types/nope',
        params: { name: 'nope' },
        body: { exclude_periodical_profit: true },
      });
      expect(res.status).toBe(404);
    });
  });
});
