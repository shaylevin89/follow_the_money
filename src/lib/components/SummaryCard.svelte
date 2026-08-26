<script>
  import { formatIls } from '../domain/money.js';
  import ProfitBreakdown from './ProfitBreakdown.svelte';

  let { label, value, details = null } = $props();

  let open = $state(false);
</script>

<div class="card summary">
  {#if details}
    <button class="head" onclick={() => (open = !open)} aria-expanded={open}>
      <span class="label">{label}</span>
      <strong class:positive={value >= 0} class:negative={value < 0}>{formatIls(value)}</strong>
      <svg class:open viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    {#if open}
      <ProfitBreakdown {details} />
    {/if}
  {:else}
    <div class="head static">
      <span class="label">{label}</span>
      <strong>{formatIls(value)}</strong>
    </div>
  {/if}
</div>

<style>
  .summary {
    padding: 0;
    overflow: hidden;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.9rem 1rem;
    background: none;
    border: none;
    color: inherit;
    text-align: left;
  }

  .label {
    flex: 1;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 600;
  }

  strong {
    font-size: 1.35rem;
    font-variant-numeric: tabular-nums;
  }

  svg {
    color: var(--muted);
    transition: transform 0.15s ease;
  }

  svg.open {
    transform: rotate(180deg);
  }
</style>
