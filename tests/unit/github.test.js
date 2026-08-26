import { describe, it, expect, vi } from 'vitest';
import { createGithubClient, ConflictError } from '../../src/lib/data/github.js';

function b64utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

const OPTS = { owner: 'o', repo: 'r', path: 'data.json', token: 't' };

describe('createGithubClient.load', () => {
  it('loads and decodes unicode content with sha', async () => {
    const payload = { investments: [], note: 'שלום ₪' };
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: b64utf8(JSON.stringify(payload)), sha: 'abc123', size: 100 }),
    });
    const client = createGithubClient({ ...OPTS, fetchFn });
    const { data, sha } = await client.load();
    expect(data).toEqual(payload);
    expect(sha).toBe('abc123');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/o/r/contents/data.json');
    expect(init.headers.Authorization).toBe('token t');
  });

  it('throws a descriptive error on failure', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    const client = createGithubClient({ ...OPTS, fetchFn });
    await expect(client.load()).rejects.toThrow(/404/);
  });
});

describe('createGithubClient.save', () => {
  it('PUTs base64 content with sha and returns the new sha', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: { sha: 'newsha' }, commit: { sha: 'commitsha' } }),
    });
    const client = createGithubClient({ ...OPTS, fetchFn });
    const data = { hello: 'שלום' };
    const { sha } = await client.save(data, 'oldsha');
    expect(sha).toBe('newsha');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/o/r/contents/data.json');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body);
    expect(body.sha).toBe('oldsha');
    expect(body.message).toBe('Update investment data');
    expect(JSON.parse(decodeURIComponent(escape(atob(body.content))))).toEqual(data);
  });

  it('throws ConflictError on 409', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ message: 'conflict' }) });
    const client = createGithubClient({ ...OPTS, fetchFn });
    await expect(client.save({}, 'old')).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws ConflictError on 422 sha mismatch', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'data.json does not match sha' }),
    });
    const client = createGithubClient({ ...OPTS, fetchFn });
    await expect(client.save({}, 'old')).rejects.toBeInstanceOf(ConflictError);
  });
});
