import { describe, it, expect } from 'vitest';
import {
  portfolioHistoryConfig,
  liquidityConfig,
  typeConfig,
} from '../../src/lib/charts.js';
import { sampleData } from './fixtures/sample-data.js';

const THEME = {
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  series: ['#2a78d6', '#eb6834'],
};

describe('portfolioHistoryConfig', () => {
  it('builds a single-series line chart from history points', () => {
    const cfg = portfolioHistoryConfig(
      [
        { date: '2020-01-01', total: 100 },
        { date: '2020-02-01', total: 150 },
      ],
      THEME
    );
    expect(cfg.type).toBe('line');
    expect(cfg.data.labels).toEqual(['2020-01-01', '2020-02-01']);
    expect(cfg.data.datasets).toHaveLength(1);
    expect(cfg.data.datasets[0].data).toEqual([100, 150]);
    expect(cfg.options.plugins.legend.display).toBe(false);
  });
});

describe('liquidityConfig', () => {
  it('splits active investments into liquid vs non-liquid ILS sums', () => {
    const { investments } = sampleData();
    const cfg = liquidityConfig(investments, 2, THEME);
    expect(cfg.type).toBe('doughnut');
    expect(cfg.data.labels).toEqual(['Liquid', 'Not liquid']);
    // liquid: fund1 13000; non-liquid: usa1 35000*2 + pension1 60000
    expect(cfg.data.datasets[0].data).toEqual([13000, 130000]);
  });
});

describe('typeConfig', () => {
  it('builds a horizontal bar of ILS value per type, sorted desc', () => {
    const { investments } = sampleData();
    const cfg = typeConfig(investments, 2, THEME);
    expect(cfg.type).toBe('bar');
    expect(cfg.options.indexAxis).toBe('y');
    expect(cfg.data.labels[0]).toBe('real_estate_loan'); // 70000 first
    const idx = cfg.data.labels.indexOf('Training_fund');
    expect(cfg.data.datasets[0].data[idx]).toBe(13000);
    // inactive investments excluded
    expect(cfg.data.labels).not.toContain('b2b_loan');
  });
});
