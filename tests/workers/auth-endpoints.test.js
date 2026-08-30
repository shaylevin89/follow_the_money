import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { applySchema, seedUser, callFn, getSetCookie } from './helpers.js';
import * as login from '../../functions/api/login.js';
import * as logout from '../../functions/api/logout.js';
import * as me from '../../functions/api/me.js';
import * as password from '../../functions/api/password.js';

const IP = '1.2.3.4';

function extractSessionToken(setCookie) {
  const match = /ftm_session=([^;]+)/.exec(setCookie || '');
  return match ? match[1] : null;
}

describe('auth endpoints', () => {
  beforeAll(() => applySchema(env.DB));

  beforeEach(async () => {
    await env.DB.prepare('DELETE FROM login_attempts').run();
    await env.DB.prepare('DELETE FROM sessions').run();
    await env.DB.prepare('DELETE FROM users').run();
  });

  describe('POST /api/login', () => {
    it('succeeds with correct credentials, setting a session cookie and mustChangePassword', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');

      const res = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true, mustChangePassword: true });

      const setCookie = getSetCookie(res);
      expect(setCookie).toContain('ftm_session=');
      expect(extractSessionToken(setCookie)).toBeTruthy();
    });

    it('rejects a wrong password with 401 and records a login_attempts row', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');

      const res = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'wrong password' },
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Invalid username or password' });

      const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE ip = ?')
        .bind(IP)
        .first();
      expect(row.count).toBe(1);
    });

    it('rejects an unknown username with 401 and records an attempt', async () => {
      const res = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'nobody', password: 'whatever123' },
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Invalid username or password' });

      const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE ip = ?')
        .bind(IP)
        .first();
      expect(row.count).toBe(1);
    });

    it('rate limits the 11th attempt within the window even with the right password', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');

      for (let i = 0; i < 10; i++) {
        const res = await callFn(login, {
          env,
          ip: IP,
          body: { username: 'shay', password: 'wrong password' },
        });
        expect(res.status).toBe(401);
      }

      const res = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toBeTruthy();
    });

    it('does not rate limit a different IP', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');

      for (let i = 0; i < 10; i++) {
        await callFn(login, {
          env,
          ip: IP,
          body: { username: 'shay', password: 'wrong password' },
        });
      }

      const res = await callFn(login, {
        env,
        ip: '9.9.9.9',
        body: { username: 'shay', password: 'correct horse battery staple' },
      });

      expect(res.status).toBe(200);
    });

    it('clears failed attempts for the IP on a successful login', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');

      for (let i = 0; i < 5; i++) {
        await callFn(login, { env, ip: IP, body: { username: 'shay', password: 'wrong' } });
      }

      const success = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });
      expect(success.status).toBe(200);

      const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE ip = ?')
        .bind(IP)
        .first();
      expect(row.count).toBe(0);
    });
  });

  describe('GET /api/me', () => {
    it('returns 401 without a session cookie', async () => {
      const res = await callFn(me, { method: 'GET', env });
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBeTruthy();
    });

    it('returns the username and mustChangePassword with a valid session cookie', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');
      const loginRes = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });
      const token = extractSessionToken(getSetCookie(loginRes));

      const res = await callFn(me, { method: 'GET', env, cookie: `ftm_session=${token}` });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ username: 'shay', mustChangePassword: true });
    });
  });

  describe('POST /api/password', () => {
    it('requires a session', async () => {
      const res = await callFn(password, {
        env,
        body: { current: 'x', next: 'newpassword1' },
      });
      expect(res.status).toBe(401);
    });

    it('changes the password: old stops working, new works, mustChangePassword cleared', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');
      const loginRes = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });
      const token = extractSessionToken(getSetCookie(loginRes));
      const cookie = `ftm_session=${token}`;

      const changeRes = await callFn(password, {
        env,
        cookie,
        body: { current: 'correct horse battery staple', next: 'brand new password' },
      });
      expect(changeRes.status).toBe(200);
      expect(await changeRes.json()).toEqual({ ok: true });

      // Old password no longer works.
      const oldLoginRes = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });
      expect(oldLoginRes.status).toBe(401);

      // New password works and mustChangePassword is cleared.
      const newLoginRes = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'brand new password' },
      });
      expect(newLoginRes.status).toBe(200);
      expect(await newLoginRes.json()).toEqual({ ok: true, mustChangePassword: false });
    });

    it('rejects a wrong current password with 401', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');
      const loginRes = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });
      const token = extractSessionToken(getSetCookie(loginRes));

      const res = await callFn(password, {
        env,
        cookie: `ftm_session=${token}`,
        body: { current: 'not the right one', next: 'brand new password' },
      });
      expect(res.status).toBe(401);
    });

    it('rejects a new password shorter than 8 characters with 400', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');
      const loginRes = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });
      const token = extractSessionToken(getSetCookie(loginRes));

      const res = await callFn(password, {
        env,
        cookie: `ftm_session=${token}`,
        body: { current: 'correct horse battery staple', next: 'short' },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/logout', () => {
    it('clears the session so the cookie no longer authenticates', async () => {
      await seedUser(env.DB, 'shay', 'correct horse battery staple');
      const loginRes = await callFn(login, {
        env,
        ip: IP,
        body: { username: 'shay', password: 'correct horse battery staple' },
      });
      const token = extractSessionToken(getSetCookie(loginRes));
      const cookie = `ftm_session=${token}`;

      const logoutRes = await callFn(logout, { env, cookie });
      expect(logoutRes.status).toBe(200);
      expect(await logoutRes.json()).toEqual({ ok: true });
      expect(getSetCookie(logoutRes)).toContain('Max-Age=0');

      const meRes = await callFn(me, { method: 'GET', env, cookie });
      expect(meRes.status).toBe(401);
    });
  });
});
