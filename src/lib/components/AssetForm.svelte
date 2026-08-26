<script>
  import { validateInvestment } from '../domain/validation.js';
  import { isLoanType } from '../domain/investments.js';
  import { get } from 'svelte/store';

  let { portfolio, inv = null, onsubmit, oncancel } = $props();

  const pstate = $derived(portfolio.state);
  const meta = $derived($pstate.data.metadata || {});
  const typeNames = $derived((meta.investment_types || []).map((t) => t.name));
  const currencies = $derived(meta.currencies || ['ILS', 'USD']);
  const profitTypes = $derived(meta.profit_types || ['price', 'commission', 'other']);

  let fields = $state(
    inv
      ? {
          name: inv.name,
          investment_type: inv.investment_type,
          initial_amount: inv.initial_amount,
          currency: inv.currency,
          start_date: inv.start_date,
          profit_type: inv.profit_type,
          profit_rate: inv.profit_rate ?? '',
          is_active: inv.is_active,
          is_liquid: inv.is_liquid,
          liquidity_date: inv.liquidity_date || '',
          track_profit: inv.track_profit,
          notes: inv.notes || '',
        }
      : {
          name: '',
          investment_type: '',
          initial_amount: '',
          currency: 'ILS',
          start_date: '',
          profit_type: 'price',
          profit_rate: '',
          is_active: true,
          is_liquid: false,
          liquidity_date: '',
          track_profit: true,
          notes: '',
        }
  );

  let errors = $state({});

  const showRate = $derived(isLoanType(fields.investment_type));

  function submit(e) {
    e.preventDefault();
    const investments = get(portfolio.state).data.investments;
    const result = validateInvestment(fields, investments, inv?.id ?? null);
    errors = result.errors;
    if (!result.valid) return;
    onsubmit({
      ...fields,
      initial_amount: Number(fields.initial_amount),
      profit_rate: showRate && fields.profit_rate !== '' ? Number(fields.profit_rate) : undefined,
      liquidity_date: fields.liquidity_date || null,
      notes: fields.notes,
    });
  }
</script>

<form onsubmit={submit} novalidate>
  <label>
    Name
    <input type="text" bind:value={fields.name} required />
    {#if errors.name}<span class="field-error">{errors.name}</span>{/if}
  </label>

  <div class="row">
    <label>
      Type
      <select bind:value={fields.investment_type} required>
        <option value="" disabled>Select type…</option>
        {#each typeNames as t (t)}
          <option value={t}>{t}</option>
        {/each}
      </select>
      {#if errors.investment_type}<span class="field-error">{errors.investment_type}</span>{/if}
    </label>
    <label>
      Currency
      <select bind:value={fields.currency}>
        {#each currencies as c (c)}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="row">
    <label>
      Initial amount
      <input type="number" inputmode="decimal" step="any" bind:value={fields.initial_amount} required />
      {#if errors.initial_amount}<span class="field-error">{errors.initial_amount}</span>{/if}
    </label>
    <label>
      Start date
      <input type="date" bind:value={fields.start_date} required />
      {#if errors.start_date}<span class="field-error">{errors.start_date}</span>{/if}
    </label>
  </div>

  <div class="row">
    <label>
      Profit type
      <select bind:value={fields.profit_type}>
        {#each profitTypes as p (p)}
          <option value={p}>{p}</option>
        {/each}
      </select>
    </label>
    {#if showRate}
      <label>
        Profit rate (%/year)
        <input type="number" inputmode="decimal" step="0.01" bind:value={fields.profit_rate} />
      </label>
    {/if}
  </div>

  <div class="checks">
    <label class="check"><input type="checkbox" bind:checked={fields.is_active} /> Active</label>
    <label class="check"><input type="checkbox" bind:checked={fields.is_liquid} /> Liquid</label>
    <label class="check"><input type="checkbox" bind:checked={fields.track_profit} /> Track profit</label>
  </div>

  {#if !fields.is_liquid}
    <label>
      Liquidity date (optional)
      <input type="date" bind:value={fields.liquidity_date} />
    </label>
  {/if}

  <label>
    Notes
    <textarea rows="2" bind:value={fields.notes}></textarea>
  </label>

  <div class="actions">
    {#if oncancel}
      <button type="button" class="btn" onclick={oncancel}>Cancel</button>
    {/if}
    <button type="submit" class="btn btn-primary">{inv ? 'Save changes' : 'Add asset'}</button>
  </div>
</form>

<style>
  form {
    display: grid;
    gap: 0.8rem;
  }

  label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }

  .checks {
    display: flex;
    gap: 1.1rem;
    flex-wrap: wrap;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-height: var(--tap);
    font-weight: 500;
  }

  .check input {
    width: 1.15rem;
    height: 1.15rem;
    min-height: 0;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
