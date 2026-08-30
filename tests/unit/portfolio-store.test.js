import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { createPortfolioStore } from '../../src/lib/stores/portfolio.js';
import { AuthError } from '../../src/lib/data/api.js';
import { sampleData } from './fixtures/sample-data.js';

function fakeApi(data = sampleData()) {
  return {
    loadPortfolio: vi.fn().mockResolvedValue(data),
    createAsset: vi.fn().mockResolvedValue({ id: 'new1' }),
    patchAsset: vi.fn().mockResolvedValue({ ok: true }),
    deleteAsset: vi.fn().mockResolvedValue({ ok: true }),
    postUpdates: vi.fn().mockResolvedValue({ inserted: 1 }),
    addType: vi.fn().mockResolvedValue({ name: 'gold', exclude_periodical_profit: true }),
    patchType: vi.fn().mockResolvedValue({ ok: true }),
  };
}

describe('portfolio store', () => {
  let api, store;

  beforeEach(async () => {
    api = fakeApi();
    store = createPortfolioStore(api);
    await store.load();
  });

  it('loads data via loadPortfolio', () => {
    const s = get(store.state);
    expect(s.data.investments).toHaveLength(4);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('addInvestment posts then reloads', async () => {
    api.loadPortfolio.mockResolvedValueOnce(sampleData()); // initial load already consumed
    const fields = {
      name: 'New',
      investment_type: 'stocks',
      initial_amount: 500,
      currency: 'ILS',
      start_date: '2024-01-01',
      profit_type: 'price',
      is_active: true,
      is_liquid: true,
      track_profit: false,
      notes: '',
    };
    await store.addInvestment(fields);
    expect(api.createAsset).toHaveBeenCalledTimes(1);
    expect(api.createAsset).toHaveBeenCalledWith(fields);
    expect(api.loadPortfolio).toHaveBeenCalledTimes(2); // initial load + reload after mutation
  });

  it('updateInvestment patches then reloads', async () => {
    await store.updateInvestment('fund1', { name: 'Renamed' });
    expect(api.patchAsset).toHaveBeenCalledWith('fund1', { name: 'Renamed' });
    expect(api.loadPortfolio).toHaveBeenCalledTimes(2);
  });

  it('deleteInvestment deletes then reloads', async () => {
    await store.deleteInvestment('fund1');
    expect(api.deleteAsset).toHaveBeenCalledWith('fund1');
    expect(api.loadPortfolio).toHaveBeenCalledTimes(2);
  });

  it('addUpdate posts an array of one update then reloads', async () => {
    await store.addUpdate('fund1', { date: '2024-02-01', amount: 14000 });
    expect(api.postUpdates).toHaveBeenCalledTimes(1);
    expect(api.postUpdates).toHaveBeenCalledWith([
      { asset_id: 'fund1', date: '2024-02-01', amount: 14000 },
    ]);
    expect(api.loadPortfolio).toHaveBeenCalledTimes(2);
  });

  it('applyCheckIn issues exactly one bulk postUpdates call with all items', async () => {
    await store.applyCheckIn([
      { id: 'fund1', date: '2024-03-01', amount: 15000 },
      { id: 'pension1', date: '2024-03-01', amount: 61000 },
    ]);
    expect(api.postUpdates).toHaveBeenCalledTimes(1);
    expect(api.postUpdates).toHaveBeenCalledWith([
      { asset_id: 'fund1', date: '2024-03-01', amount: 15000 },
      { asset_id: 'pension1', date: '2024-03-01', amount: 61000 },
    ]);
    expect(api.loadPortfolio).toHaveBeenCalledTimes(2);
  });

  it('addType posts then reloads', async () => {
    await store.addType('gold', true);
    expect(api.addType).toHaveBeenCalledWith('gold', true);
    expect(api.loadPortfolio).toHaveBeenCalledTimes(2);
  });

  it('updateType resolves idx to the type name from metadata and patches', async () => {
    const idx = get(store.state).data.metadata.investment_types.findIndex(
      (t) => t.name === 'Training_fund'
    );
    await store.updateType(idx, { exclude_periodical_profit: true });
    expect(api.patchType).toHaveBeenCalledWith('Training_fund', {
      exclude_periodical_profit: true,
    });
    expect(api.loadPortfolio).toHaveBeenCalledTimes(2);
  });

  it('sets saving true during a mutation', async () => {
    let sawSaving = false;
    api.patchAsset.mockImplementationOnce(async () => {
      sawSaving = get(store.state).saving;
      return { ok: true };
    });
    await store.updateInvestment('fund1', { name: 'X' });
    expect(sawSaving).toBe(true);
    expect(get(store.state).saving).toBe(false);
  });

  it('sets authRequired on AuthError and stops without reloading further', async () => {
    api.patchAsset.mockRejectedValueOnce(new AuthError());
    await store.updateInvestment('fund1', { name: 'X' });
    const s = get(store.state);
    expect(s.authRequired).toBe(true);
    expect(s.saving).toBe(false);
    expect(api.loadPortfolio).toHaveBeenCalledTimes(1); // only the initial load, no reload after auth failure
  });

  it('sets error message on non-auth errors', async () => {
    api.patchAsset.mockRejectedValueOnce(new Error('boom'));
    await store.updateInvestment('fund1', { name: 'X' });
    const s = get(store.state);
    expect(s.error).toBe('boom');
    expect(s.saving).toBe(false);
    expect(s.authRequired).toBe(false);
  });

  it('sets authRequired when the initial load fails with AuthError', async () => {
    const freshApi = fakeApi();
    freshApi.loadPortfolio.mockRejectedValueOnce(new AuthError());
    const freshStore = createPortfolioStore(freshApi);
    await expect(freshStore.load()).rejects.toBeInstanceOf(AuthError);
    expect(get(freshStore.state).authRequired).toBe(true);
  });
});
