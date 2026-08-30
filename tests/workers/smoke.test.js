import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { applySchema } from './helpers.js';

describe('schema', () => {
  beforeAll(() => applySchema(env.DB));

  it('creates the tables', async () => {
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();
    const names = results.map((r) => r.name);
    for (const t of ['users', 'sessions', 'assets', 'asset_updates', 'investment_types', 'login_attempts']) {
      expect(names).toContain(t);
    }
  });
});
