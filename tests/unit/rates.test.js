import { describe, it, expect, vi } from 'vitest';
import { getUsdToIlsRate } from '../../src/lib/data/rates.js';

function memStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    _store: store,
  };
}

describe('getUsdToIlsRate', () => {
  it('returns the API rate and caches it', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ rates: { ILS: 3.72 } }) });
    const storage = memStorage();
    const rate = await getUsdToIlsRate({ fetchFn, storage });
    expect(rate).toBe(3.72);
    expect(JSON.parse(storage._store.ftm_usd_ils).rate).toBe(3.72);
  });

  it('falls back to cached rate on failure', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'));
    const storage = memStorage({ ftm_usd_ils: JSON.stringify({ rate: 3.5, ts: 1 }) });
    expect(await getUsdToIlsRate({ fetchFn, storage })).toBe(3.5);
  });

  it('falls back to 3.65 with no cache', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await getUsdToIlsRate({ fetchFn, storage: memStorage() })).toBe(3.65);
  });
});
