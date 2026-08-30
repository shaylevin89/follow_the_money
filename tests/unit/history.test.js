import { describe, it, expect } from 'vitest';
import { portfolioHistory, assetHistory, typeHistoryByYear } from '../../src/lib/domain/history.js';

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

  it('drops inactive investments after their last update (money moved elsewhere)', () => {
    const investments = [
      {
        id: 'active',
        is_active: true,
        currency: 'ILS',
        updates: [
          { date: '2020-01-01', amount: 100 },
          { date: '2021-01-01', amount: 110 },
        ],
      },
      {
        id: 'closed',
        is_active: false,
        currency: 'ILS',
        updates: [{ date: '2020-06-01', amount: 500 }],
      },
    ];
    expect(portfolioHistory(investments, 1)).toEqual([
      { date: '2020-01-01', total: 100 },
      { date: '2020-06-01', total: 600 }, // still held at its last update date
      { date: '2021-01-01', total: 110 }, // closed asset no longer counted
    ]);
  });
});

describe('typeHistoryByYear', () => {
  const investments = [
    {
      id: 'a',
      is_active: true,
      currency: 'ILS',
      investment_type: 'stocks',
      updates: [
        { date: '2020-03-01', amount: 100 },
        { date: '2022-02-01', amount: 300 },
      ],
    },
    {
      id: 'b',
      is_active: true,
      currency: 'USD',
      investment_type: 'crypto',
      updates: [{ date: '2021-06-01', amount: 10 }],
    },
    {
      id: 'closed',
      is_active: false,
      currency: 'ILS',
      investment_type: 'stocks',
      updates: [{ date: '2020-06-01', amount: 500 }],
    },
  ];

  it('builds year-end totals per type with carry-forward', () => {
    const { years, series } = typeHistoryByYear(investments, 2, {
      now: new Date('2022-06-15'),
    });
    expect(years).toEqual([2020, 2021, 2022]);
    const stocks = series.find((s) => s.type === 'stocks');
    const crypto = series.find((s) => s.type === 'crypto');
    // Year-end snapshots: the closed asset's last update (2020-06-01) is
    // before 2020-12-31, and inactive assets drop after their final update —
    // consistent with the portfolio-over-time chart.
    expect(stocks.values).toEqual([100, 100, 300]);
    expect(crypto.values).toEqual([0, 20, 20]); // 10 USD × 2 from 2021
  });

  it('folds beyond maxSeries types into Other, ranked by final-year value', () => {
    const many = ['t1', 't2', 't3'].map((type, i) => ({
      id: type,
      is_active: true,
      currency: 'ILS',
      investment_type: type,
      updates: [{ date: '2022-01-01', amount: (i + 1) * 100 }],
    }));
    const { series } = typeHistoryByYear(many, 1, { now: new Date('2022-06-15'), maxSeries: 2 });
    expect(series.map((s) => s.type)).toEqual(['t3', 'Other']);
    expect(series[1].values).toEqual([100 + 200]); // t1 + t2 folded
  });

  it('returns empty for no updates', () => {
    expect(typeHistoryByYear([], 1, { now: new Date('2022-01-01') })).toEqual({
      years: [],
      series: [],
    });
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
