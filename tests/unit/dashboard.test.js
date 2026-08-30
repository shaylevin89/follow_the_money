import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import Dashboard from '../../src/views/Dashboard.svelte';
import { createPortfolioStore } from '../../src/lib/stores/portfolio.js';
import { sampleData } from './fixtures/sample-data.js';

vi.mock('chart.js/auto', () => ({
  default: class ChartMock {
    constructor() {}
    destroy() {}
  },
}));

async function makePortfolio() {
  const api = {
    loadPortfolio: vi.fn().mockResolvedValue(sampleData()),
  };
  const store = createPortfolioStore(api);
  await store.load();
  return store;
}

describe('Dashboard', () => {
  it('renders total value and profit cards with breakdown toggle', async () => {
    const portfolio = await makePortfolio();
    render(Dashboard, { portfolio, rate: 2 });

    // total: usa1 35000*2 + fund1 13000 + pension1 60000 = 143,000
    expect(screen.getByText('₪143,000')).toBeInTheDocument();
    expect(screen.getByText('Monthly profit')).toBeInTheDocument();
    expect(screen.getByText('Yearly profit')).toBeInTheDocument();

    // breakdown hidden until tapped
    expect(screen.queryByText('USA Real Estate Loan 1')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /monthly profit/i }));
    expect(screen.getByText('USA Real Estate Loan 1')).toBeInTheDocument();
    expect(screen.getByText('Training Fund A')).toBeInTheDocument();
  });

  it('renders chart sections', async () => {
    const portfolio = await makePortfolio();
    render(Dashboard, { portfolio, rate: 2 });
    expect(screen.getByText('Portfolio over time')).toBeInTheDocument();
    expect(screen.getByText('Liquidity')).toBeInTheDocument();
    expect(screen.getByText('By investment type')).toBeInTheDocument();
  });
});
