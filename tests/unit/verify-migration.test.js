import { describe, it, expect } from 'vitest';
import { comparePortfolios } from '../../scripts/verify-migration.mjs';

function local(investments) {
  return { investments };
}

function remote(investments) {
  return { investments };
}

describe('comparePortfolios', () => {
  it('returns no mismatches when local and remote agree', () => {
    const asset = {
      id: 'a1',
      initial_amount: 100,
      updates: [
        { date: '2020-01-01', amount: 100 },
        { date: '2020-02-01', amount: 150 },
      ],
    };
    const mismatches = comparePortfolios(local([asset]), remote([asset]));
    expect(mismatches).toEqual([]);
  });

  it('flags a mismatched asset count', () => {
    const asset = { id: 'a1', initial_amount: 100, updates: [] };
    const mismatches = comparePortfolios(local([asset, { ...asset, id: 'a2' }]), remote([asset]));
    expect(mismatches.some((m) => m.includes('asset count mismatch'))).toBe(true);
  });

  it('flags a mismatched latest amount', () => {
    const localAsset = { id: 'a1', initial_amount: 100, updates: [{ date: '2020-01-01', amount: 100 }] };
    const remoteAsset = { id: 'a1', initial_amount: 100, updates: [{ date: '2020-01-01', amount: 999 }] };
    const mismatches = comparePortfolios(local([localAsset]), remote([remoteAsset]));
    expect(mismatches.some((m) => m.includes('latest amount mismatch'))).toBe(true);
  });

  it('flags a mismatched update count', () => {
    const localAsset = {
      id: 'a1',
      initial_amount: 100,
      updates: [
        { date: '2020-01-01', amount: 100 },
        { date: '2020-02-01', amount: 110 },
      ],
    };
    const remoteAsset = { id: 'a1', initial_amount: 100, updates: [{ date: '2020-01-01', amount: 100 }] };
    const mismatches = comparePortfolios(local([localAsset]), remote([remoteAsset]));
    expect(mismatches.some((m) => m.includes('update count mismatch'))).toBe(true);
  });

  it('dedupes local updates by date (last write per date wins), matching D1 latest-per-date semantics', () => {
    const localAsset = {
      id: 'a1',
      initial_amount: 100,
      updates: [
        { date: '2020-01-01', amount: 100 },
        { date: '2020-01-01', amount: 105 }, // correction on the same date
        { date: '2020-02-01', amount: 110 },
      ],
    };
    const remoteAsset = {
      id: 'a1',
      initial_amount: 100,
      updates: [
        { date: '2020-01-01', amount: 105 },
        { date: '2020-02-01', amount: 110 },
      ],
    };
    const mismatches = comparePortfolios(local([localAsset]), remote([remoteAsset]));
    expect(mismatches).toEqual([]);
  });

  it('flags an asset missing from the remote portfolio', () => {
    const asset = { id: 'a1', initial_amount: 100, updates: [] };
    const mismatches = comparePortfolios(local([asset]), remote([]));
    expect(mismatches.some((m) => m.includes('missing from remote'))).toBe(true);
  });

  it('flags an asset present remotely but not locally', () => {
    const asset = { id: 'a1', initial_amount: 100, updates: [] };
    const mismatches = comparePortfolios(local([]), remote([asset]));
    expect(mismatches.some((m) => m.includes('not in local data.json'))).toBe(true);
  });

  it('uses initial_amount as the latest amount when an asset has no updates', () => {
    const asset = { id: 'a1', initial_amount: 250, updates: [] };
    const mismatches = comparePortfolios(local([asset]), remote([asset]));
    expect(mismatches).toEqual([]);
  });
});
