// Portfolio state + mutations. Every mutation updates local state, stamps
// lastUpdated, and persists through the injected GitHub client.
import { writable } from 'svelte/store';
import { ConflictError } from '../data/github.js';

export function createPortfolioStore(client) {
  const state = writable({
    data: null,
    sha: null,
    loading: false,
    saving: false,
    error: null,
    conflict: false,
  });

  let current;
  state.subscribe((s) => {
    current = s;
  });

  async function load() {
    state.update((s) => ({ ...s, loading: true, error: null, conflict: false }));
    try {
      const { data, sha } = await client.load();
      state.update((s) => ({ ...s, data, sha, loading: false }));
    } catch (e) {
      state.update((s) => ({ ...s, loading: false, error: e.message }));
      throw e;
    }
  }

  async function persist() {
    state.update((s) => ({ ...s, saving: true, error: null }));
    try {
      const { sha } = await client.save(current.data, current.sha);
      state.update((s) => ({ ...s, sha, saving: false }));
    } catch (e) {
      if (e instanceof ConflictError) {
        state.update((s) => ({ ...s, saving: false, conflict: true }));
      } else {
        state.update((s) => ({ ...s, saving: false, error: e.message }));
      }
    }
  }

  function mutate(fn) {
    state.update((s) => {
      const data = structuredClone(s.data);
      fn(data);
      data.lastUpdated = new Date().toISOString();
      return { ...s, data };
    });
    return persist();
  }

  function applyUpdate(inv, { date, amount }) {
    inv.updates = inv.updates || [];
    const existing = inv.updates.find((u) => u.date === date);
    if (existing) {
      existing.amount = amount;
    } else {
      inv.updates.push({ date, amount });
      inv.updates.sort((a, b) => a.date.localeCompare(b.date));
    }
    inv.current_amount = inv.updates[inv.updates.length - 1].amount;
  }

  return {
    state,
    load,
    reload: load,

    addInvestment(fields) {
      return mutate((data) => {
        const amount = Number(fields.initial_amount);
        data.investments.push({
          id: Date.now().toString(),
          name: fields.name.trim(),
          is_active: fields.is_active ?? true,
          track_profit: fields.track_profit ?? false,
          start_date: fields.start_date,
          end_date: null,
          initial_amount: amount,
          currency: fields.currency,
          current_amount: amount,
          profit_type: fields.profit_type,
          notes: fields.notes || '',
          is_liquid: fields.is_liquid ?? false,
          investment_type: fields.investment_type,
          liquidity_date: fields.liquidity_date || null,
          updates: [{ date: fields.start_date, amount }],
          ...(fields.profit_rate != null && fields.profit_rate !== ''
            ? { profit_rate: Number(fields.profit_rate) }
            : {}),
        });
      });
    },

    updateInvestment(id, fields) {
      return mutate((data) => {
        const inv = data.investments.find((i) => i.id === id);
        if (!inv) throw new Error(`Investment ${id} not found`);
        Object.assign(inv, fields);
      });
    },

    deleteInvestment(id) {
      return mutate((data) => {
        data.investments = data.investments.filter((i) => i.id !== id);
      });
    },

    addUpdate(id, { date, amount }) {
      return mutate((data) => {
        const inv = data.investments.find((i) => i.id === id);
        if (!inv) throw new Error(`Investment ${id} not found`);
        applyUpdate(inv, { date, amount: Number(amount) });
      });
    },

    applyCheckIn(updates) {
      return mutate((data) => {
        for (const { id, date, amount } of updates) {
          const inv = data.investments.find((i) => i.id === id);
          if (!inv) continue;
          applyUpdate(inv, { date, amount: Number(amount) });
        }
      });
    },

    addType(name, exclude = false) {
      return mutate((data) => {
        data.metadata = data.metadata || { investment_types: [] };
        data.metadata.investment_types = data.metadata.investment_types || [];
        data.metadata.investment_types.push({ name, exclude_periodical_profit: exclude });
      });
    },

    updateType(idx, fields) {
      return mutate((data) => {
        Object.assign(data.metadata.investment_types[idx], fields);
      });
    },
  };
}
