import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import Assets from '../../src/views/Assets.svelte';
import { createPortfolioStore } from '../../src/lib/stores/portfolio.js';
import { sampleData } from './fixtures/sample-data.js';

async function makePortfolio(data = sampleData()) {
  const client = {
    load: vi.fn().mockResolvedValue({ data, sha: 's' }),
    save: vi.fn().mockResolvedValue({ sha: 's2' }),
  };
  const store = createPortfolioStore(client);
  await store.load();
  return store;
}

describe('Assets view', () => {
  it('lists active assets by default, inactive on toggle', async () => {
    const portfolio = await makePortfolio();
    render(Assets, { portfolio, rate: 2 });
    expect(screen.getByText('USA Real Estate Loan 1')).toBeInTheDocument();
    expect(screen.queryByText('Closed Loan')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/show inactive/i));
    expect(screen.getByText('Closed Loan')).toBeInTheDocument();
  });

  it('filters by type and shows the filtered total', async () => {
    const portfolio = await makePortfolio();
    render(Assets, { portfolio, rate: 2 });

    await userEvent.click(screen.getByRole('button', { name: /filter & sort/i }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Training_fund' }));
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(screen.getByText('Training Fund A')).toBeInTheDocument();
    expect(screen.queryByText('USA Real Estate Loan 1')).not.toBeInTheDocument();
    expect(screen.getByText(/filtered total/i).textContent).toContain('₪13,000');
  });

  it('marks stale assets with a dot', async () => {
    // fund1's last update is 2022-01-01 — stale for any recent "now".
    const portfolio = await makePortfolio();
    render(Assets, { portfolio, rate: 2 });
    expect(screen.getAllByLabelText(/not updated recently/i).length).toBeGreaterThan(0);
  });
});
