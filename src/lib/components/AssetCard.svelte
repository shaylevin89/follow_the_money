<script>
  import { formatIls, formatNumber, toIls } from '../domain/money.js';
  import { currentAmount } from '../domain/investments.js';

  let { inv, rate, stale = false, onclick } = $props();

  const amount = $derived(currentAmount(inv));
  const ils = $derived(toIls(amount, inv.currency, rate));
</script>

<button class="card asset" {onclick}>
  <div class="left">
    <span class="name">
      {inv.name}
      {#if stale}
        <span class="stale-dot" title="Not updated recently" aria-label="Not updated recently"></span>
      {/if}
    </span>
    <span class="meta">
      <span class="chip">{inv.investment_type}</span>
      {#if !inv.is_active}
        <span class="chip inactive">inactive</span>
      {/if}
    </span>
  </div>
  <div class="right">
    <strong>{formatIls(ils)}</strong>
    {#if inv.currency !== 'ILS'}
      <span class="muted native">${formatNumber(amount)}</span>
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
    padding: 0.8rem 1rem;
    color: inherit;
  }

  .left {
    display: grid;
    gap: 0.25rem;
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

  .chip.inactive {
    color: var(--negative);
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
</style>
