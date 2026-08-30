import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { get } from 'svelte/store';
import CheckIn from '../../src/views/CheckIn.svelte';
import Settings from '../../src/views/Settings.svelte';
import { createPortfolioStore } from '../../src/lib/stores/portfolio.js';
import { sampleData } from './fixtures/sample-data.js';
import { makeFakeApi } from './fixtures/fake-api.js';

async function makePortfolio() {
  const api = makeFakeApi(sampleData());
  const store = createPortfolioStore(api);
  await store.load();
  return { store, api };
}

describe('CheckIn view', () => {
  it('lists only active assets', async () => {
    const { store } = await makePortfolio();
    render(CheckIn, { portfolio: store });
    expect(screen.getByLabelText(/new value for Training Fund A/i)).toBeInTheDocument();
    expect(screen.queryByText('Closed Loan')).not.toBeInTheDocument();
  });

  it('saves only filled values, in a single commit', async () => {
    const { store, api } = await makePortfolio();
    render(CheckIn, { portfolio: store });

    await userEvent.type(screen.getByLabelText(/new value for Training Fund A/i), '15500');
    await userEvent.type(screen.getByLabelText(/new value for Pension X/i), '62000');
    await userEvent.click(screen.getByRole('button', { name: /save all/i }));

    const data = get(store.state).data;
    expect(data.investments.find((i) => i.id === 'fund1').current_amount).toBe(15500);
    expect(data.investments.find((i) => i.id === 'pension1').current_amount).toBe(62000);
    // usa1 untouched
    expect(data.investments.find((i) => i.id === 'usa1').current_amount).toBe(35000);
    expect(api.postUpdates).toHaveBeenCalledTimes(1);
  });

  it('disables save with nothing filled', async () => {
    const { store } = await makePortfolio();
    render(CheckIn, { portfolio: store });
    expect(screen.getByRole('button', { name: /save all/i })).toBeDisabled();
  });
});

describe('Settings view', () => {
  it('adds a new investment type', async () => {
    const { store } = await makePortfolio();
    render(Settings, { portfolio: store, onclearToken: vi.fn() });

    await userEvent.type(screen.getByLabelText(/new type name/i), 'gold');
    await userEvent.click(screen.getByRole('button', { name: /add type/i }));

    const meta = get(store.state).data.metadata;
    expect(meta.investment_types.some((t) => t.name === 'gold')).toBe(true);
  });

  it('disconnect clears the token', async () => {
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem,
    });
    const { store } = await makePortfolio();
    const onclearToken = vi.fn();
    render(Settings, { portfolio: store, onclearToken });
    await userEvent.click(screen.getByRole('button', { name: /disconnect token/i }));
    expect(removeItem).toHaveBeenCalledWith('ftm_github_token');
    expect(onclearToken).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
