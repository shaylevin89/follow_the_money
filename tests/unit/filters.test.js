import { describe, it, expect } from 'vitest';
import { filterByTypes, sortInvestments, sumIls } from '../../src/lib/domain/filters.js';
import { sampleData } from './fixtures/sample-data.js';

const investments = sampleData().investments;

describe('filterByTypes', () => {
  it('returns all when types empty', () => {
    expect(filterByTypes(investments, [])).toHaveLength(investments.length);
  });
  it('filters by type membership', () => {
    const out = filterByTypes(investments, ['Training_fund', 'pension']);
    expect(out.map((i) => i.id)).toEqual(['fund1', 'pension1']);
  });
});

describe('sortInvestments', () => {
  it('sorts by name asc/desc', () => {
    const asc = sortInvestments(investments, 'name', 'asc').map((i) => i.name);
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)));
    const desc = sortInvestments(investments, 'name', 'desc').map((i) => i.name);
    expect(desc).toEqual([...asc].reverse());
  });
  it('sorts by current_amount numerically', () => {
    const out = sortInvestments(investments, 'current_amount', 'desc');
    expect(out[0].id).toBe('pension1'); // 60000
  });
  it('sorts by start_date', () => {
    const out = sortInvestments(investments, 'start_date', 'asc');
    expect(out[0].id).toBe('usa1'); // 2017
  });
  it('does not mutate the input array', () => {
    const before = investments.map((i) => i.id);
    sortInvestments(investments, 'name', 'desc');
    expect(investments.map((i) => i.id)).toEqual(before);
  });
});

describe('sumIls', () => {
  it('sums current amounts in ILS', () => {
    // usa1 35000 USD × 2 + fund1 13000 + dead1 0 + pension1 60000
    expect(sumIls(investments, 2)).toBeCloseTo(70000 + 13000 + 0 + 60000);
  });
});
