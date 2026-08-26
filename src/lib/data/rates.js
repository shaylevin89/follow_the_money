// USD → ILS exchange rate with cached fallback.

const CACHE_KEY = 'ftm_usd_ils';
const DEFAULT_RATE = 3.65;
const RATE_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export async function getUsdToIlsRate({ fetchFn = fetch, storage } = {}) {
  try {
    const res = await fetchFn(RATE_URL);
    if (!res.ok) throw new Error(`rate fetch failed: ${res.status}`);
    const data = await res.json();
    const rate = data.rates?.ILS;
    if (typeof rate !== 'number') throw new Error('no ILS rate in response');
    try {
      storage?.setItem(CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }));
    } catch {
      // storage unavailable — ignore
    }
    return rate;
  } catch {
    try {
      const cached = storage?.getItem(CACHE_KEY);
      if (cached) {
        const { rate } = JSON.parse(cached);
        if (typeof rate === 'number') return rate;
      }
    } catch {
      // fall through to default
    }
    return DEFAULT_RATE;
  }
}
