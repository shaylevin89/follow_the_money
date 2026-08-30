import { describe, it, expect } from 'vitest';
import {
  portfolioHistoryConfig,
  liquidityConfig,
  typeConfig,
  currencyConfig,
  topAssetsConfig,
  typeHistoryConfig,
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

describe('currencyConfig', () => {
  it('splits active holdings into ILS vs USD (in ₪ equivalent)', () => {
    const { investments } = sampleData();
    const cfg = currencyConfig(investments, 2, THEME);
    expect(cfg.type).toBe('doughnut');
    expect(cfg.data.labels).toEqual(['ILS', 'USD']);
    // ILS: fund1 13000 + pension1 60000; USD: usa1 35000*2
    expect(cfg.data.datasets[0].data).toEqual([73000, 70000]);
  });
});

describe('topAssetsConfig', () => {
  it('ranks the top active assets by ILS value, descending', () => {
    const { investments } = sampleData();
    const cfg = topAssetsConfig(investments, 2, THEME, 2);
    expect(cfg.type).toBe('bar');
    expect(cfg.options.indexAxis).toBe('y');
    expect(cfg.data.labels).toEqual(['USA Real Estate Loan 1', 'Pension X']); // 70000, 60000
    expect(cfg.data.datasets[0].data).toEqual([70000, 60000]);
  });
});

describe('doughnut numbers (liquidity & currency)', () => {
  it('legend entries carry value and percentage', () => {
    const { investments } = sampleData();
    const cfg = liquidityConfig(investments, 2, THEME);
    const fakeChart = {
      data: cfg.data,
    };
    const labels = cfg.options.plugins.legend.labels.generateLabels(fakeChart);
    // liquid 13000 / total 143000 ≈ 9%
    expect(labels[0].text).toBe('Liquid · ₪13,000 · 9%');
    expect(labels[1].text).toBe('Not liquid · ₪130,000 · 91%');
  });

  it('includes a center-total plugin', () => {
    const { investments } = sampleData();
    const cfg = currencyConfig(investments, 2, THEME);
    expect(cfg.plugins?.[0]?.id).toBe('centerTotal');
    expect(typeof cfg.plugins[0].afterDraw).toBe('function');
  });
});

describe('typeHistoryConfig', () => {
  it('builds stacked yearly bars, one dataset per type', () => {
    const cfg = typeHistoryConfig(
      {
        years: [2020, 2021],
        series: [
          { type: 'stocks', values: [100, 200] },
          { type: 'crypto', values: [0, 50] },
        ],
      },
      THEME
    );
    expect(cfg.type).toBe('bar');
    expect(cfg.data.labels).toEqual(['2020', '2021']);
    expect(cfg.data.datasets.map((d) => d.label)).toEqual(['stocks', 'crypto']);
    expect(cfg.data.datasets[0].data).toEqual([100, 200]);
    expect(cfg.options.scales.x.stacked).toBe(true);
    expect(cfg.options.scales.y.stacked).toBe(true);
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
