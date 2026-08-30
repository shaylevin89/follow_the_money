<script>
  import { formatIls, formatNumber, toIls } from '../domain/money.js';
  import { currentAmount, lastUpdate } from '../domain/investments.js';

  let { inv, rate, stale = false, typeIndex = 0, onclick } = $props();

  const amount = $derived(currentAmount(inv));
  const ils = $derived(toIls(amount, inv.currency, rate));
  const latest = $derived(lastUpdate(inv));
  const returnPct = $derived(
    inv.initial_amount > 0 ? ((amount - inv.initial_amount) / inv.initial_amount) * 100 : null
  );
  // Stable, muted per-type color from the validated palette (8 slots).
  const typeColor = $derived(`var(--viz-${(typeIndex % 8) + 1})`);
</script>

<button class="card asset" style="--type-color: {typeColor}" {onclick}>
  <div class="left">
    <span class="name">
      {inv.name}
      {#if stale}
        <span class="stale-dot" title="Not updated recently" aria-label="Not updated recently"></span>
      {/if}
    </span>
    <span class="meta">
      <span class="chip type-chip"><span class="type-dot" aria-hidden="true"></span>{inv.investment_type}</span>
      {#if inv.is_liquid}
        <span class="chip liquid">liquid</span>
      {/if}
      {#if !inv.is_active}
        <span class="chip inactive">inactive</span>
      {/if}
    </span>
    {#if latest}
      <span class="muted updated">updated {latest.date}</span>
    {/if}
  </div>
  <div class="right">
    <strong>{formatIls(ils)}</strong>
    {#if inv.currency !== 'ILS'}
      <span class="muted native">${formatNumber(amount)}</span>
    {/if}
    {#if returnPct !== null && inv.is_active}
      <span class="return" class:positive={returnPct >= 0} class:negative={returnPct < 0}>
        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
      </span>
    {/if}
  </div>
</button>

<style>
  .asset {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    text-align: left;
    border: 1px solid var(--border);
    border-left: 3px solid var(--type-color);
    padding: 0.8rem 1rem;
    color: inherit;
  }

  .left {
    display: grid;
    gap: 0.3rem;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .stale-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--warning);
    flex: 0 0 auto;
  }

  .meta {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .type-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .type-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--type-color);
    flex: 0 0 auto;
  }

  .chip.liquid {
    color: var(--positive);
  }

  .chip.inactive {
    color: var(--negative);
  }

  .updated {
    font-size: 0.75rem;
  }

  .right {
    display: grid;
    justify-items: end;
    gap: 0.1rem;
  }

  strong {
    font-size: 1.05rem;
    font-variant-numeric: tabular-nums;
  }

  .native {
    font-size: 0.8rem;
  }

  .return {
    font-size: 0.8rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>
