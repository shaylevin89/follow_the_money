import { describe, it, expect, vi } from 'vitest';
import { getToken, setToken, clearToken } from '../../src/lib/data/token.js';

function memStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    _store: store,
  };
}

describe('token handling', () => {
  it('reads token from storage', () => {
    const storage = memStorage({ ftm_github_token: 'tok1' });
    expect(getToken({ storage, location: { search: '' }, history: { replaceState: vi.fn() } })).toBe('tok1');
  });

  it('adopts ?token= from URL, persists it, and scrubs the URL', () => {
    const storage = memStorage();
    const history = { replaceState: vi.fn() };
    const location = { search: '?token=urltok&x=1', pathname: '/app/', hash: '' };
    expect(getToken({ storage, location, history })).toBe('urltok');
    expect(storage._store.ftm_github_token).toBe('urltok');
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/app/?x=1');
  });

  it('returns null when no token anywhere', () => {
    expect(getToken({ storage: memStorage(), location: { search: '' }, history: { replaceState: vi.fn() } })).toBeNull();
  });

  it('setToken / clearToken round-trip', () => {
    const storage = memStorage();
    setToken(storage, 'abc');
    expect(storage._store.ftm_github_token).toBe('abc');
    clearToken(storage);
    expect(storage._store.ftm_github_token).toBeUndefined();
  });
});
