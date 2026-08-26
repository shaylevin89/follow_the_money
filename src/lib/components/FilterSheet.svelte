<script>
  let { types, selected, sortBy, sortDir, onapply, onclose } = $props();

  let localSelected = $state([...selected]);
  let localSortBy = $state(sortBy);
  let localSortDir = $state(sortDir);

  function toggle(type) {
    localSelected = localSelected.includes(type)
      ? localSelected.filter((t) => t !== type)
      : [...localSelected, type];
  }

  function apply() {
    onapply({ selected: localSelected, sortBy: localSortBy, sortDir: localSortDir });
    onclose();
  }
</script>

<div
  class="backdrop"
  onclick={onclose}
  onkeydown={(e) => e.key === 'Escape' && onclose()}
  role="presentation"
></div>
<div class="sheet" role="dialog" aria-label="Filter and sort">
  <h3>Filter by type</h3>
  <div class="types">
    {#each types as type (type)}
      <label class="type">
        <input type="checkbox" checked={localSelected.includes(type)} onchange={() => toggle(type)} />
        <span>{type}</span>
      </label>
    {/each}
  </div>

  <h3>Sort</h3>
  <div class="sort">
    <select bind:value={localSortBy} aria-label="Sort by">
      <option value="name">Name</option>
      <option value="current_amount">Value</option>
      <option value="start_date">Start date</option>
      <option value="investment_type">Type</option>
    </select>
    <select bind:value={localSortDir} aria-label="Sort direction">
      <option value="asc">Ascending</option>
      <option value="desc">Descending</option>
    </select>
  </div>

  <div class="actions">
    <button class="btn" onclick={() => (localSelected = [])}>Clear filters</button>
    <button class="btn btn-primary" onclick={apply}>Apply</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 30;
  }

  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 31;
    background: var(--surface);
    border-radius: var(--radius) var(--radius) 0 0;
    padding: 1rem 1rem calc(env(safe-area-inset-bottom) + 1rem);
    max-height: 80dvh;
    overflow-y: auto;
  }

  h3 {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0.5rem 0;
  }

  .types {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
  }

  .type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: var(--tap);
  }

  .type input {
    width: 1.15rem;
    height: 1.15rem;
    min-height: 0;
  }

  .sort {
    display: flex;
    gap: 0.5rem;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  @media (min-width: 768px) {
    .sheet {
      left: 50%;
      right: auto;
      bottom: auto;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 440px;
      border-radius: var(--radius);
    }
  }
</style>
