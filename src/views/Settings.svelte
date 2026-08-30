<script>
  import { settings } from '../lib/stores/settings.js';
  import { toast } from '../lib/stores/ui.js';
  import ChangePassword from '../lib/components/ChangePassword.svelte';

  let { portfolio, api, username, onlogout } = $props();

  const pstate = $derived(portfolio.state);
  const types = $derived($pstate.data.metadata?.investment_types || []);

  let newTypeName = $state('');
  let newTypeExclude = $state(false);

  async function addType(e) {
    e.preventDefault();
    const name = newTypeName.trim();
    if (!name) return;
    if (types.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      toast('Type already exists', 'error');
      return;
    }
    await portfolio.addType(name, newTypeExclude);
    toast('Type added');
    newTypeName = '';
    newTypeExclude = false;
  }

  async function handleChangePassword(current, next) {
    await api.changePassword(current, next);
    toast('Password changed');
  }

  async function logout() {
    await api.logout();
    onlogout();
  }
</script>

<h1>Settings</h1>

<section class="card">
  <h3>Staleness reminder</h3>
  <p class="muted">Show a dot on assets not updated for this many months.</p>
  <label class="inline">
    Months
    <input
      type="number"
      min="1"
      max="24"
      value={$settings.stalenessMonths}
      onchange={(e) => settings.update((s) => ({ ...s, stalenessMonths: Number(e.target.value) || 3 }))}
    />
  </label>
</section>

<section class="card">
  <h3>Investment types</h3>
  <ul class="types">
    {#each types as t, idx (`${t.name}#${idx}`)}
      <li>
        <span class="name">{t.name}</span>
        <label class="inline small">
          <input
            type="checkbox"
            checked={t.exclude_periodical_profit}
            onchange={(e) => portfolio.updateType(idx, { exclude_periodical_profit: e.target.checked })}
          />
          exclude from profit
        </label>
      </li>
    {/each}
  </ul>
  <form class="add-type" onsubmit={addType}>
    <input type="text" placeholder="New type name" bind:value={newTypeName} aria-label="New type name" />
    <label class="inline small">
      <input type="checkbox" bind:checked={newTypeExclude} />
      exclude from profit
    </label>
    <button class="btn" type="submit" disabled={!newTypeName.trim()}>Add type</button>
  </form>
</section>

<section class="card">
  <h3>Account</h3>
  <p class="muted">Signed in as {username}</p>
  <ChangePassword onsubmit={handleChangePassword} requireCurrent={true} />
  <button class="btn btn-danger logout" onclick={logout}>Log out</button>
</section>

<style>
  h1 {
    font-size: 1.4rem;
  }

  section {
    margin-bottom: 0.75rem;
  }

  h3 {
    font-size: 1rem;
    color: var(--muted);
  }

  .inline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .inline input[type='number'] {
    width: 90px;
  }

  .inline.small {
    font-weight: 500;
    font-size: 0.82rem;
    color: var(--muted);
  }

  .inline input[type='checkbox'] {
    width: 1.1rem;
    height: 1.1rem;
    min-height: 0;
  }

  .types {
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
  }

  .types li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border);
  }

  .types li:last-child {
    border-bottom: none;
  }

  .types .name {
    font-weight: 600;
    font-size: 0.92rem;
  }

  .add-type {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.5rem;
    align-items: center;
  }

  .logout {
    margin-top: 0.9rem;
  }

  @media (max-width: 480px) {
    .add-type {
      grid-template-columns: 1fr;
    }
  }
</style>
