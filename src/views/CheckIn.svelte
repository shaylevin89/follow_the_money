<script>
  import { activeInvestments, currentAmount, lastUpdate } from '../lib/domain/investments.js';
  import { formatNumber } from '../lib/domain/money.js';
  import { navigate, toast } from '../lib/stores/ui.js';

  let { portfolio } = $props();

  const pstate = $derived(portfolio.state);
  const active = $derived(activeInvestments($pstate.data.investments));

  let date = $state(new Date().toISOString().split('T')[0]);
  let amounts = $state({});
  let saving = $state(false);

  const changed = $derived(
    Object.entries(amounts).filter(([, v]) => v !== '' && v != null && !isNaN(Number(v)))
  );

  async function saveAll(e) {
    e.preventDefault();
    if (changed.length === 0) return;
    saving = true;
    try {
      await portfolio.applyCheckIn(
        changed.map(([id, amount]) => ({ id, date, amount: Number(amount) }))
      );
      toast(`Updated ${changed.length} asset${changed.length > 1 ? 's' : ''} in one commit`);
      amounts = {};
      navigate('dashboard');
    } finally {
      saving = false;
    }
  }
</script>

<h1>Check-in</h1>
<p class="muted">
  Enter today's value for the assets you checked. Leave the rest empty — only filled
  values are saved, all in a single commit.
</p>

<form onsubmit={saveAll}>
  <label class="date-row">
    Update date
    <input type="date" bind:value={date} required />
  </label>

  <div class="list">
    {#each active as inv (inv.id)}
      {@const last = lastUpdate(inv)}
      <div class="card row">
        <div class="who">
          <span class="name">{inv.name}</span>
          <span class="muted small">
            {inv.currency === 'USD' ? '$' : '₪'}{formatNumber(currentAmount(inv))}
            {#if last}
              · {last.date}
            {/if}
          </span>
        </div>
        <input
          type="number"
          inputmode="decimal"
          step="any"
          placeholder={`${formatNumber(currentAmount(inv))}`}
          bind:value={amounts[inv.id]}
          aria-label="New value for {inv.name}"
        />
      </div>
    {/each}
  </div>

  <div class="footer">
    <span class="muted">{changed.length} of {active.length} filled</span>
    <button class="btn btn-primary" type="submit" disabled={changed.length === 0 || saving}>
      {saving ? 'Saving…' : 'Save all'}
    </button>
  </div>
</form>

<style>
  h1 {
    font-size: 1.4rem;
  }

  .date-row {
    display: grid;
    gap: 0.3rem;
    font-weight: 600;
    font-size: 0.88rem;
    margin-bottom: 0.75rem;
    max-width: 240px;
  }

  .list {
    display: grid;
    gap: 0.5rem;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 130px;
    gap: 0.6rem;
    align-items: center;
    padding: 0.6rem 0.9rem;
  }

  .who {
    display: grid;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .small {
    font-size: 0.8rem;
  }

  .footer {
    position: sticky;
    bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 0.5rem);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 0.6rem 1rem;
  }
</style>
