<script>
  import { formatNumber } from '../domain/money.js';

  let { updates, currency } = $props();

  const sorted = $derived(updates.slice().sort((a, b) => b.date.localeCompare(a.date)));
  const symbol = $derived(currency === 'USD' ? '$' : '₪');
</script>

<ul>
  <!-- Key includes the index: legacy data can contain duplicate dates. -->
  {#each sorted as u, i (`${u.date}#${i}`)}
    {@const prev = sorted[i + 1]}
    <li>
      <span class="date muted">{u.date}</span>
      <span class="amount">{symbol}{formatNumber(u.amount)}</span>
      {#if prev}
        {@const diff = u.amount - prev.amount}
        <span class="diff" class:positive={diff >= 0} class:negative={diff < 0}>
          {diff >= 0 ? '+' : '−'}{formatNumber(Math.abs(diff))}
        </span>
      {:else}
        <span class="diff muted">start</span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.75rem;
    align-items: baseline;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
  }

  li:last-child {
    border-bottom: none;
  }

  .date {
    font-size: 0.85rem;
  }

  .amount {
    font-weight: 600;
  }

  .diff {
    font-size: 0.85rem;
    min-width: 70px;
    text-align: right;
  }
</style>
