<script>
  import { formatIls } from '../domain/money.js';

  let { details } = $props();
</script>

<div class="breakdown">
  {#if details.length === 0}
    <p class="muted">No investments with profit tracking enabled.</p>
  {:else}
    <ul>
      {#each details as d (d.name)}
        <li>
          <div class="who">
            <span class="name">{d.name}</span>
            <span class="muted calc">{d.calculation}</span>
          </div>
          <span class:positive={d.profit >= 0} class:negative={d.profit < 0}>
            {formatIls(d.profit)}
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .breakdown {
    border-top: 1px solid var(--border);
    padding: 0.5rem 1rem 0.75rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
  }

  li:last-child {
    border-bottom: none;
  }

  .who {
    display: grid;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    font-size: 0.92rem;
  }

  .calc {
    font-size: 0.8rem;
    overflow-wrap: anywhere;
  }
</style>
