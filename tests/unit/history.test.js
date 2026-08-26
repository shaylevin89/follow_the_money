import { describe, it, expect } from 'vitest';
import { portfolioHistory, assetHistory } from '../../src/lib/domain/history.js';

describe('portfolioHistory', () => {
  it('aggregates carry-forward totals across investments in ILS', () => {
    const investments = [
      {
        id: 'a',
        currency: 'ILS',
        updates: [
          { date: '2020-01-01', amount: 100 },
          { date: '2020-03-01', amount: 150 },
        ],
      },
      {
        id: 'b',
        currency: 'USD',
        updates: [{ date: '2020-02-01', amount: 10 }],
      },
    ];
    const points = portfolioHistory(investments, 2);
    expect(points).toEqual([
      { date: '2020-01-01', total: 100 }, // a=100, b not started
      { date: '2020-02-01', total: 120 }, // a=100 carried, b=10*2
      { date: '2020-03-01', total: 170 }, // a=150, b=20
    ]);
  });

  it('returns empty array for no updates', () => {
    expect(portfolioHistory([{ id: 'a', currency: 'ILS', updates: [] }], 1)).toEqual([]);
  });
});

describe('assetHistory', () => {
  it('returns sorted points with ILS conversion', () => {
    const inv = {
      currency: 'USD',
      updates: [
        { date: '2020-02-01', amount: 20 },
        { date: '2020-01-01', amount: 10 },
      ],
    };
    expect(assetHistory(inv, 3)).toEqual([
      { date: '2020-01-01', amount: 10, amountIls: 30 },
      { date: '2020-02-01', amount: 20, amountIls: 60 },
    ]);
  });

  it('handles missing updates', () => {
    expect(assetHistory({ currency: 'ILS' }, 1)).toEqual([]);
  });
});
