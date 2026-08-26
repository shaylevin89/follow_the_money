<script>
  import { filterByTypes, sortInvestments, sumIls } from '../lib/domain/filters.js';
  import { isStale } from '../lib/domain/staleness.js';
  import { formatIls } from '../lib/domain/money.js';
  import { navigate } from '../lib/stores/ui.js';
  import { settings } from '../lib/stores/settings.js';
  import AssetCard from '../lib/components/AssetCard.svelte';
  import FilterSheet from '../lib/components/FilterSheet.svelte';

  let { portfolio, rate } = $props();

  const pstate = $derived(portfolio.state);

  let selectedTypes = $state([]);
  let sortBy = $state('current_amount');
  let sortDir = $state('desc');
  let sheetOpen = $state(false);
  let showInactive = $state(false);

  const investments = $derived($pstate.data.investments);
  const allTypes = $derived(
    [...new Set(investments.map((i) => i.investment_type))].sort((a, b) => a.localeCompare(b))
  );
  const visible = $derived(
    sortInvestments(
      filterByTypes(
        investments.filter((i) => showInactive || i.is_active),
        selectedTypes
      ),
      sortBy,
      sortDir
    )
  );
  const filteredSum = $derived(sumIls(visible, rate));
</script>

<header>
  <h1>Assets</h1>
  <button class="btn" onclick={() => (sheetOpen = true)}>
    Filter & sort
    {#if selectedTypes.length > 0}
      <span class="badge">{selectedTypes.length}</span>
    {/if}
  </button>
</header>

<p class="muted sub">
  {visible.length} assets
  {#if selectedTypes.length > 0}
    · filtered total <strong class="positive">{formatIls(filteredSum)}</strong>
  {/if}
</p>

<label class="inactive-toggle">
  <input type="checkbox" bind:checked={showInactive} />
  Show inactive
</label>

<div class="list">
  {#each visible as inv (inv.id)}
    <AssetCard
      {inv}
      {rate}
      stale={isStale(inv, $settings.stalenessMonths)}
      onclick={() => navigate('asset', { id: inv.id })}
    />
  {/each}
  {#if visible.length === 0}
    <p class="muted">No assets match the current filter.</p>
  {/if}
</div>

<button class="fab" onclick={() => navigate('asset', { id: null })} aria-label="Add asset">
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
</button>

{#if sheetOpen}
  <FilterSheet
    types={allTypes}
    selected={selectedTypes}
    {sortBy}
    {sortDir}
    onapply={(v) => {
      selectedTypes = v.selected;
      sortBy = v.sortBy;
      sortDir = v.sortDir;
    }}
    onclose={() => (sheetOpen = false)}
  />
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  h1 {
    font-size: 1.4rem;
    margin: 0;
  }

  .badge {
    background: var(--accent);
    color: var(--accent-contrast);
    border-radius: 999px;
    font-size: 0.75rem;
    padding: 0 0.45rem;
    font-weight: 700;
  }

  .sub {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
  }

  .inactive-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 0.75rem;
  }

  .inactive-toggle input {
    width: 1.1rem;
    height: 1.1rem;
    min-height: 0;
  }

  .list {
    display: grid;
    gap: 0.6rem;
  }

  .fab {
    position: fixed;
    right: 1rem;
    bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 1rem);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: var(--accent-contrast);
    box-shadow: var(--shadow);
    display: grid;
    place-items: center;
    z-index: 15;
  }

  @media (min-width: 768px) {
    .fab {
      bottom: 2rem;
    }
  }
</style>
