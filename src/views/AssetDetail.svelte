<script>
  import { assetHistory } from '../lib/domain/history.js';
  import { currentAmount } from '../lib/domain/investments.js';
  import { formatIls, formatNumber, toIls } from '../lib/domain/money.js';
  import { portfolioHistoryConfig } from '../lib/charts.js';
  import { navigate, toast } from '../lib/stores/ui.js';
  import AssetForm from '../lib/components/AssetForm.svelte';
  import UpdateTimeline from '../lib/components/UpdateTimeline.svelte';
  import ChartCard from '../lib/components/ChartCard.svelte';

  let { portfolio, rate, id } = $props();

  const pstate = $derived(portfolio.state);
  const inv = $derived(id ? $pstate.data.investments.find((i) => i.id === id) : null);
  const isCreate = $derived(!id);

  let editing = $state(false);
  let confirmingDelete = $state(false);
  let updDate = $state(new Date().toISOString().split('T')[0]);
  let updAmount = $state('');

  const history = $derived(inv ? assetHistory(inv, rate) : []);
  const returnPct = $derived(
    inv && inv.initial_amount > 0
      ? ((currentAmount(inv) - inv.initial_amount) / inv.initial_amount) * 100
      : null
  );

  async function saveNew(fields) {
    await portfolio.addInvestment(fields);
    toast('Asset added');
    navigate('assets');
  }

  async function saveEdit(fields) {
    // initial_amount is intentionally omitted: it's read-only in edit mode
    // (PATCH /api/assets/:id rejects it) — amount changes go through the
    // "Update value" flow instead.
    await portfolio.updateInvestment(id, {
      name: fields.name.trim(),
      investment_type: fields.investment_type,
      currency: fields.currency,
      start_date: fields.start_date,
      profit_type: fields.profit_type,
      is_active: fields.is_active,
      is_liquid: fields.is_liquid,
      liquidity_date: fields.liquidity_date,
      track_profit: fields.track_profit,
      staleness_reminder: fields.staleness_reminder,
      notes: fields.notes,
      ...(fields.profit_rate !== undefined ? { profit_rate: fields.profit_rate } : {}),
    });
    toast('Asset updated');
    editing = false;
  }

  async function addUpdate(e) {
    e.preventDefault();
    if (updAmount === '' || isNaN(Number(updAmount))) return;
    await portfolio.addUpdate(id, { date: updDate, amount: Number(updAmount) });
    toast('Value updated');
    updAmount = '';
  }

  async function doDelete() {
    await portfolio.deleteInvestment(id);
    toast('Asset deleted');
    navigate('assets');
  }
</script>

{#if isCreate}
  <button class="btn back" onclick={() => navigate('assets')}>← Assets</button>
  <h1>Add asset</h1>
  <div class="card">
    <AssetForm {portfolio} onsubmit={saveNew} oncancel={() => navigate('assets')} />
  </div>
{:else if !inv}
  <p class="muted">Asset not found.</p>
  <button class="btn" onclick={() => navigate('assets')}>Back to assets</button>
{:else}
  <button class="btn back" onclick={() => navigate('assets')}>← Assets</button>

  <header>
    <div>
      <h1>{inv.name}</h1>
      <div class="chips">
        <span class="chip">{inv.investment_type}</span>
        <span class="chip">{inv.currency}</span>
        {#if !inv.is_active}<span class="chip negative">inactive</span>{/if}
        {#if inv.is_liquid}<span class="chip">liquid</span>{/if}
      </div>
    </div>
    <div class="value">
      <strong>{formatIls(toIls(currentAmount(inv), inv.currency, rate))}</strong>
      {#if returnPct !== null}
        <span class:positive={returnPct >= 0} class:negative={returnPct < 0}>
          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}% since start
        </span>
      {/if}
    </div>
  </header>

  {#if editing}
    <div class="card">
      <AssetForm {portfolio} {inv} onsubmit={saveEdit} oncancel={() => (editing = false)} />
    </div>
  {:else}
    {#if history.length >= 2}
      <ChartCard
        title="Value history"
        height={220}
        buildConfig={(theme) =>
          portfolioHistoryConfig(
            history.map((h) => ({ date: h.date, total: h.amountIls })),
            theme
          )}
      />
    {/if}

    <section class="card">
      <h3>Update value</h3>
      <form class="update-form" onsubmit={addUpdate}>
        <input type="date" bind:value={updDate} aria-label="Update date" />
        <input
          type="number"
          inputmode="decimal"
          step="any"
          placeholder={`${formatNumber(currentAmount(inv))}`}
          bind:value={updAmount}
          aria-label="New amount ({inv.currency})"
        />
        <button class="btn btn-primary" type="submit" disabled={updAmount === ''}>Save</button>
      </form>
    </section>

    <section class="card">
      <h3>History</h3>
      <UpdateTimeline updates={inv.updates || []} currency={inv.currency} />
    </section>

    {#if inv.notes}
      <section class="card">
        <h3>Notes</h3>
        <p class="notes">{inv.notes}</p>
      </section>
    {/if}

    <div class="danger-zone">
      <button class="btn" onclick={() => (editing = true)}>Edit details</button>
      {#if confirmingDelete}
        <span>Delete permanently?</span>
        <button class="btn btn-danger" onclick={doDelete}>Yes, delete</button>
        <button class="btn" onclick={() => (confirmingDelete = false)}>Cancel</button>
      {:else}
        <button class="btn danger-text" onclick={() => (confirmingDelete = true)}>Delete</button>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .back {
    margin-bottom: 0.75rem;
    border: none;
    background: none;
    color: var(--accent);
    padding-left: 0;
    font-weight: 600;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.35rem;
    margin-bottom: 0.35rem;
  }

  .chips {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .chip.negative {
    color: var(--negative);
  }

  .value {
    display: grid;
    justify-items: end;
    gap: 0.15rem;
    text-align: right;
  }

  .value strong {
    font-size: 1.3rem;
    font-variant-numeric: tabular-nums;
  }

  .value span {
    font-size: 0.85rem;
  }

  section.card, :global(.asset-chart) {
    margin-bottom: 0.75rem;
  }

  h3 {
    font-size: 1rem;
    color: var(--muted);
  }

  .update-form {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
  }

  .notes {
    margin: 0;
    white-space: pre-wrap;
  }

  .danger-zone {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .danger-text {
    color: var(--negative);
  }
</style>
