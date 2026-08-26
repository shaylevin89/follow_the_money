import { describe, it, expect } from 'vitest';
import { profitBreakdown } from '../../src/lib/domain/profit.js';
import { sampleData } from './fixtures/sample-data.js';

const NOW = new Date('2024-01-01T00:00:00Z');

function inv(overrides) {
  return {
    id: 'x',
    name: 'X',
    is_active: true,
    track_profit: true,
    start_date: '2020-01-01',
    initial_amount: 12000,
    currency: 'ILS',
    current_amount: 12000,
    investment_type: 'stocks',
    updates: [],
    ...overrides,
  };
}

const META = {
  investment_types: [
    { name: 'stocks', exclude_periodical_profit: false },
    { name: 'real_estate_loan', exclude_periodical_profit: false },
    { name: 'pension', exclude_periodical_profit: true },
  ],
};

describe('profitBreakdown — loan-rate branch', () => {
  it('computes monthly profit for a mature loan: amount × rate% / 12', () => {
    const loans = [
      inv({ investment_type: 'real_estate_loan', profit_rate: 6, current_amount: 12000 }),
    ];
    const { total, details } = profitBreakdown(loans, META, 1, 30, NOW);
    expect(total).toBeCloseTo((12000 * 0.06) / 12); // 60
    expect(details).toHaveLength(1);
    expect(details[0].calculation).toContain('× 6%');
  });

  it('computes yearly profit for a mature loan: amount × rate%', () => {
    const loans = [
      inv({ investment_type: 'real_estate_loan', profit_rate: 6, current_amount: 12000 }),
    ];
    const { total } = profitBreakdown(loans, META, 1, 365, NOW);
    expect(total).toBeCloseTo(12000 * 0.06); // 720
  });

  it('pro-rates a loan younger than the period', () => {
    // Started 15 days before NOW
    const loans = [
      inv({
        investment_type: 'real_estate_loan',
        profit_rate: 12,
        current_amount: 12000,
        start_date: '2023-12-17',
      }),
    ];
    const { total } = profitBreakdown(loans, META, 1, 30, NOW);
    const daysSinceStart = (NOW - new Date('2023-12-17')) / 86400000;
    expect(total).toBeCloseTo(((12000 * 0.12) / 12) * (daysSinceStart / 30));
  });

  it('converts USD loans at the given rate', () => {
    const loans = [
      inv({ investment_type: 'real_estate_loan', profit_rate: 6, current_amount: 12000, currency: 'USD' }),
    ];
    const { total } = profitBreakdown(loans, META, 3.5, 30, NOW);
    expect(total).toBeCloseTo(((12000 * 0.06) / 12) * 3.5);
  });
});

describe('profitBreakdown — updates branch', () => {
  it('pro-rates change over the period when elapsed > period', () => {
    const items = [
      inv({
        updates: [
          { date: '2022-01-01', amount: 10000 },
          { date: '2023-01-01', amount: 11200 }, // +1200 over 365 days
        ],
      }),
    ];
    const { total } = profitBreakdown(items, META, 1, 30, NOW);
    expect(total).toBeCloseTo((1200 / 365) * 30);
  });

  it('uses the raw change when elapsed < period', () => {
    const items = [
      inv({
        updates: [
          { date: '2023-12-20', amount: 10000 },
          { date: '2023-12-30', amount: 10100 },
        ],
      }),
    ];
    const { total } = profitBreakdown(items, META, 1, 30, NOW);
    expect(total).toBeCloseTo(100);
  });

  it('skips investments with fewer than 2 updates and no loan rate', () => {
    const items = [inv({ updates: [{ date: '2023-01-01', amount: 10 }] })];
    const { total, details } = profitBreakdown(items, META, 1, 30, NOW);
    expect(total).toBe(0);
    expect(details).toHaveLength(0);
  });
});

describe('profitBreakdown — filtering', () => {
  it('excludes types flagged exclude_periodical_profit, inactive, and untracked', () => {
    const items = [
      inv({ investment_type: 'pension', updates: [
        { date: '2022-01-01', amount: 100 },
        { date: '2023-01-01', amount: 200 },
      ] }),
      inv({ is_active: false, updates: [
        { date: '2022-01-01', amount: 100 },
        { date: '2023-01-01', amount: 200 },
      ] }),
      inv({ track_profit: false, updates: [
        { date: '2022-01-01', amount: 100 },
        { date: '2023-01-01', amount: 200 },
      ] }),
    ];
    const { total, details } = profitBreakdown(items, META, 1, 30, NOW);
    expect(total).toBe(0);
    expect(details).toHaveLength(0);
  });

  it('handles the realistic fixture without errors', () => {
    const { investments, metadata } = sampleData();
    const { total, details } = profitBreakdown(investments, metadata, 3.7, 30, NOW);
    // usa1 (loan) + fund1 (updates); pension excluded, dead1 inactive
    expect(details.map((d) => d.name)).toEqual(['USA Real Estate Loan 1', 'Training Fund A']);
    expect(total).toBeGreaterThan(0);
  });
});
