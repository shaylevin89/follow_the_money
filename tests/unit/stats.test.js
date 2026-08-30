import { describe, it, expect } from 'vitest';
import { portfolioStats } from '../../src/lib/domain/stats.js';
import { sampleData } from './fixtures/sample-data.js';

const NOW = new Date('2024-06-15T00:00:00Z');

describe('portfolioStats', () => {
  it('counts active, stale, and liquid share', () => {
    const { investments } = sampleData();
    const stats = portfolioStats(investments, 2, 3, NOW);
    // active: usa1, fund1, pension1
    expect(stats.activeCount).toBe(3);
    // all three active assets have last updates long before 2024-03 → stale
    expect(stats.staleCount).toBe(3);
    // liquid: fund1 (13000) of total 143000
    expect(stats.liquidPct).toBeCloseTo((13000 / 143000) * 100, 1);
  });

  it('handles empty portfolios', () => {
    const stats = portfolioStats([], 1, 3, NOW);
    expect(stats).toEqual({ activeCount: 0, staleCount: 0, liquidPct: 0 });
  });
});
