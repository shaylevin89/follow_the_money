import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { applySchema } from './helpers.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSessionUser,
  destroySession,
  sessionCookie,
  clearSessionCookie,
  json,
} from '../../functions/lib/auth.js';

async function seedUser(db, overrides = {}) {
  const passwordHash = overrides.password_hash ?? (await hashPassword('correct horse'));
  await db
    .prepare(
      'INSERT INTO users (id, username, password_hash, must_change_password) VALUES (?, ?, ?, ?)'
    )
    .bind(
      overrides.id ?? 1,
      overrides.username ?? 'shay',
      passwordHash,
      overrides.must_change_password ?? 0
    )
    .run();
  return overrides.id ?? 1;
}

function requestWithCookie(token) {
  return new Request('https://example.com/api/me', {
    headers: token ? { Cookie: `ftm_session=${token}` } : {},
  });
}

describe('auth', () => {
  beforeAll(() => applySchema(env.DB));

  beforeEach(async () => {
    await env.DB.prepare('DELETE FROM sessions').run();
    await env.DB.prepare('DELETE FROM users').run();
  });

  describe('hashPassword / verifyPassword', () => {
    it('round-trips a correct password', async () => {
      const stored = await hashPassword('correct horse battery staple');
      expect(await verifyPassword('correct horse battery staple', stored)).toBe(true);
    });

    it('stores in the expected iterations$salt$hash format', async () => {
      const stored = await hashPassword('hunter2');
      const parts = stored.split('$');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('100000');
    });

    it('rejects a wrong password', async () => {
      const stored = await hashPassword('correct horse battery staple');
      expect(await verifyPassword('wrong password', stored)).toBe(false);
    });

    it('rejects a tampered stored string', async () => {
      const stored = await hashPassword('correct horse battery staple');
      const [iterations, salt, hash] = stored.split('$');
      // Flip the last character of the hash to tamper it.
      const tamperedHash = hash.slice(0, -1) + (hash.at(-1) === 'A' ? 'B' : 'A');
      const tampered = `${iterations}$${salt}$${tamperedHash}`;
      expect(await verifyPassword('correct horse battery staple', tampered)).toBe(false);
    });
  });

  describe('createSession / getSessionUser / destroySession', () => {
    it('round-trips a session via a Request with the cookie header', async () => {
      const userId = await seedUser(env.DB);
      const token = await createSession(env.DB, userId);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const user = await getSessionUser(env.DB, requestWithCookie(token));
      expect(user).toEqual({ id: userId, username: 'shay', must_change_password: 0 });
    });

    it('returns null when there is no cookie', async () => {
      const user = await getSessionUser(env.DB, requestWithCookie());
      expect(user).toBeNull();
    });

    it('returns null for an unknown session token', async () => {
      const user = await getSessionUser(env.DB, requestWithCookie('nonexistent-token'));
      expect(user).toBeNull();
    });

    it('returns null for an expired session', async () => {
      const userId = await seedUser(env.DB);
      const token = await createSession(env.DB, userId);

      const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?')
        .bind(past, token)
        .run();

      const user = await getSessionUser(env.DB, requestWithCookie(token));
      expect(user).toBeNull();
    });

    it('returns null after destroySession', async () => {
      const userId = await seedUser(env.DB);
      const token = await createSession(env.DB, userId);

      await destroySession(env.DB, requestWithCookie(token));

      const user = await getSessionUser(env.DB, requestWithCookie(token));
      expect(user).toBeNull();

      const row = await env.DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
      expect(row).toBeNull();
    });

    it('slides expiry forward when fewer than 45 days remain', async () => {
      const userId = await seedUser(env.DB);
      const token = await createSession(env.DB, userId);

      const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?')
        .bind(thirtyDaysOut, token)
        .run();

      const user = await getSessionUser(env.DB, requestWithCookie(token));
      expect(user).not.toBeNull();

      const row = await env.DB.prepare('SELECT expires_at FROM sessions WHERE token = ?')
        .bind(token)
        .first();
      const newExpiry = new Date(row.expires_at).getTime();
      const ninetyDaysOut = Date.now() + 90 * 24 * 60 * 60 * 1000;
      // Refreshed expiry should be pushed back out to ~90 days, well past
      // the old 30-day mark.
      expect(newExpiry).toBeGreaterThan(Date.now() + 45 * 24 * 60 * 60 * 1000);
      expect(newExpiry).toBeLessThanOrEqual(ninetyDaysOut + 60 * 1000);
    });

    it('does not slide expiry when more than 45 days remain', async () => {
      const userId = await seedUser(env.DB);
      const token = await createSession(env.DB, userId);

      const before = await env.DB.prepare('SELECT expires_at FROM sessions WHERE token = ?')
        .bind(token)
        .first();

      await getSessionUser(env.DB, requestWithCookie(token));

      const after = await env.DB.prepare('SELECT expires_at FROM sessions WHERE token = ?')
        .bind(token)
        .first();
      expect(after.expires_at).toBe(before.expires_at);
    });
  });

  describe('sessionCookie / clearSessionCookie', () => {
    it('builds a Set-Cookie value with the expected attributes', () => {
      const cookie = sessionCookie('abc123');
      expect(cookie).toContain('ftm_session=abc123');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('Max-Age=');
    });

    it('builds a clearing Set-Cookie value', () => {
      const cookie = clearSessionCookie();
      expect(cookie).toContain('ftm_session=');
      expect(cookie).toContain('Max-Age=0');
    });
  });

  describe('json', () => {
    it('returns a Response with the given status and JSON body', async () => {
      const res = json({ ok: true }, 201);
      expect(res.status).toBe(201);
      expect(res.headers.get('Content-Type')).toContain('application/json');
      expect(await res.json()).toEqual({ ok: true });
    });

    it('defaults to status 200 and merges extra headers', async () => {
      const res = json({ hello: 'world' }, undefined, { 'X-Test': '1' });
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Test')).toBe('1');
      expect(await res.json()).toEqual({ hello: 'world' });
    });
  });
});
