import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { createPortfolioStore } from '../../src/lib/stores/portfolio.js';
import { ConflictError } from '../../src/lib/data/github.js';
import { sampleData } from './fixtures/sample-data.js';

function fakeClient(data = sampleData()) {
  return {
    load: vi.fn().mockResolvedValue({ data, sha: 'sha0' }),
    save: vi.fn().mockResolvedValue({ sha: 'sha1' }),
  };
}

describe('portfolio store', () => {
  let client, store;

  beforeEach(async () => {
    client = fakeClient();
    store = createPortfolioStore(client);
    await store.load();
  });

  it('loads data and sha', () => {
    const s = get(store.state);
    expect(s.data.investments).toHaveLength(4);
    expect(s.sha).toBe('sha0');
    expect(s.loading).toBe(false);
  });

  it('addInvestment appends with generated id, seeded update, and saves', async () => {
    await store.addInvestment({
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
    });
    const s = get(store.state);
    const added = s.data.investments.find((i) => i.name === 'New');
    expect(added).toBeTruthy();
    expect(added.updates).toEqual([{ date: '2024-01-01', amount: 500 }]);
    expect(added.current_amount).toBe(500);
    expect(client.save).toHaveBeenCalledTimes(1);
    expect(s.sha).toBe('sha1'); // sha updated after save
  });

  it('updateInvestment merges fields and saves', async () => {
    await store.updateInvestment('fund1', { name: 'Renamed' });
    const s = get(store.state);
    expect(s.data.investments.find((i) => i.id === 'fund1').name).toBe('Renamed');
    expect(client.save).toHaveBeenCalledTimes(1);
  });

  it('deleteInvestment removes and saves', async () => {
    await store.deleteInvestment('fund1');
    expect(get(store.state).data.investments.find((i) => i.id === 'fund1')).toBeUndefined();
    expect(client.save).toHaveBeenCalledTimes(1);
  });

  it('addUpdate appends, replaces same-date entries, and sets current_amount', async () => {
    await store.addUpdate('fund1', { date: '2024-02-01', amount: 14000 });
    let inv = get(store.state).data.investments.find((i) => i.id === 'fund1');
    expect(inv.current_amount).toBe(14000);
    expect(inv.updates.filter((u) => u.date === '2024-02-01')).toHaveLength(1);

    await store.addUpdate('fund1', { date: '2024-02-01', amount: 14500 });
    inv = get(store.state).data.investments.find((i) => i.id === 'fund1');
    expect(inv.updates.filter((u) => u.date === '2024-02-01')).toHaveLength(1);
    expect(inv.updates.find((u) => u.date === '2024-02-01').amount).toBe(14500);
  });

  it('applyCheckIn applies all updates with a single save', async () => {
    await store.applyCheckIn([
      { id: 'fund1', date: '2024-03-01', amount: 15000 },
      { id: 'pension1', date: '2024-03-01', amount: 61000 },
    ]);
    const s = get(store.state);
    expect(s.data.investments.find((i) => i.id === 'fund1').current_amount).toBe(15000);
    expect(s.data.investments.find((i) => i.id === 'pension1').current_amount).toBe(61000);
    expect(client.save).toHaveBeenCalledTimes(1);
  });

  it('sets conflict flag on ConflictError and keeps local edits', async () => {
    client.save.mockRejectedValueOnce(new ConflictError());
    await store.updateInvestment('fund1', { name: 'Conflicted' });
    const s = get(store.state);
    expect(s.conflict).toBe(true);
    expect(s.data.investments.find((i) => i.id === 'fund1').name).toBe('Conflicted');
  });

  it('addType and updateType manage metadata types', async () => {
    await store.addType('gold', true);
    let meta = get(store.state).data.metadata;
    expect(meta.investment_types.find((t) => t.name === 'gold')).toEqual({
      name: 'gold',
      exclude_periodical_profit: true,
    });
    const idx = meta.investment_types.findIndex((t) => t.name === 'gold');
    await store.updateType(idx, { exclude_periodical_profit: false });
    meta = get(store.state).data.metadata;
    expect(meta.investment_types[idx].exclude_periodical_profit).toBe(false);
  });

  it('updates lastUpdated on mutation', async () => {
    const before = get(store.state).data.lastUpdated;
    await store.updateInvestment('fund1', { notes: 'x' });
    expect(get(store.state).data.lastUpdated).not.toBe(before);
  });
});
