import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { get } from 'svelte/store';
import AssetDetail from '../../src/views/AssetDetail.svelte';
import { createPortfolioStore } from '../../src/lib/stores/portfolio.js';
import { sampleData } from './fixtures/sample-data.js';
import { makeFakeApi } from './fixtures/fake-api.js';

vi.mock('chart.js/auto', () => ({
  default: class ChartMock {
    constructor() {}
    destroy() {}
  },
}));

async function makePortfolio() {
  const api = makeFakeApi(sampleData());
  const store = createPortfolioStore(api);
  await store.load();
  return { store, api };
}

describe('AssetDetail — existing asset', () => {
  it('shows value, return %, and update history', async () => {
    const { store } = await makePortfolio();
    render(AssetDetail, { portfolio: store, rate: 2, id: 'fund1' });
    expect(screen.getByText('Training Fund A')).toBeInTheDocument();
    expect(screen.getAllByText('₪13,000').length).toBeGreaterThan(0);
    expect(screen.getByText(/\+30\.0% since start/)).toBeInTheDocument();
    expect(screen.getByText('2020-01-01')).toBeInTheDocument();
  });

  it('adds a value update through the form', async () => {
    const { store, api } = await makePortfolio();
    render(AssetDetail, { portfolio: store, rate: 2, id: 'fund1' });

    await userEvent.type(screen.getByLabelText(/new amount/i), '14000');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    const inv = get(store.state).data.investments.find((i) => i.id === 'fund1');
    expect(inv.current_amount).toBe(14000);
    expect(api.postUpdates).toHaveBeenCalledTimes(1);
  });

  it('deletes after confirmation', async () => {
    const { store } = await makePortfolio();
    render(AssetDetail, { portfolio: store, rate: 2, id: 'fund1' });

    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, delete/i }));

    expect(get(store.state).data.investments.find((i) => i.id === 'fund1')).toBeUndefined();
  });

  it('edits fields via the form with validation', async () => {
    const { store } = await makePortfolio();
    render(AssetDetail, { portfolio: store, rate: 2, id: 'fund1' });

    await userEvent.click(screen.getByRole('button', { name: /edit details/i }));
    const nameInput = screen.getByLabelText(/^name$/i);
    await userEvent.clear(nameInput);
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();

    await userEvent.type(nameInput, 'Renamed Fund');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(get(store.state).data.investments.find((i) => i.id === 'fund1').name).toBe(
      'Renamed Fund'
    );
  });
});

describe('AssetDetail — staleness reminder toggle', () => {
  it('persists opting out of the staleness reminder', async () => {
    const { store } = await makePortfolio();
    render(AssetDetail, { portfolio: store, rate: 2, id: 'fund1' });

    await userEvent.click(screen.getByRole('button', { name: /edit details/i }));
    const toggle = screen.getByRole('checkbox', { name: /remind to update/i });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(
      get(store.state).data.investments.find((i) => i.id === 'fund1').staleness_reminder
    ).toBe(false);
  });
});

describe('AssetDetail — create mode', () => {
  it('creates a new asset', async () => {
    const { store, api } = await makePortfolio();
    render(AssetDetail, { portfolio: store, rate: 2, id: null });

    await userEvent.type(screen.getByLabelText(/^name$/i), 'Gold Bar');
    await userEvent.selectOptions(screen.getByLabelText(/^type$/i), 'Training_fund');
    await userEvent.type(screen.getByLabelText(/initial amount/i), '2500');
    const dateInput = screen.getByLabelText(/start date/i);
    await userEvent.type(dateInput, '2024-01-15');
    await userEvent.click(screen.getByRole('button', { name: /add asset/i }));

    const added = get(store.state).data.investments.find((i) => i.name === 'Gold Bar');
    expect(added).toBeTruthy();
    expect(added.updates).toEqual([{ date: '2024-01-15', amount: 2500 }]);
    expect(api.createAsset).toHaveBeenCalledTimes(1);
  });

  it('blocks duplicate name + start date', async () => {
    const { store, api } = await makePortfolio();
    render(AssetDetail, { portfolio: store, rate: 2, id: null });

    await userEvent.type(screen.getByLabelText(/^name$/i), 'Training Fund A');
    await userEvent.selectOptions(screen.getByLabelText(/^type$/i), 'Training_fund');
    await userEvent.type(screen.getByLabelText(/initial amount/i), '100');
    await userEvent.type(screen.getByLabelText(/start date/i), '2020-01-01');
    await userEvent.click(screen.getByRole('button', { name: /add asset/i }));

    expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    expect(api.createAsset).not.toHaveBeenCalled();
  });
});
