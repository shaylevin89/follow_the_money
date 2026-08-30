// Portfolio state + mutations. Every mutation calls the D1 API through the
// injected api client, then reloads the whole portfolio from the server —
// the server is the single source of truth, so this stays simple and
// always consistent (the portfolio GET is one cheap request).
import { writable } from 'svelte/store';
import { AuthError } from '../data/api.js';

export function createPortfolioStore(api) {
  const state = writable({
    data: null,
    loading: false,
    saving: false,
    error: null,
    authRequired: false,
  });

  let current;
  state.subscribe((s) => {
    current = s;
  });

  async function load() {
    state.update((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.loadPortfolio();
      state.update((s) => ({ ...s, data, loading: false }));
    } catch (e) {
      if (e instanceof AuthError) {
        state.update((s) => ({ ...s, loading: false, authRequired: true }));
      } else {
        state.update((s) => ({ ...s, loading: false, error: e.message }));
      }
      throw e;
    }
  }

  async function mutate(fn) {
    state.update((s) => ({ ...s, saving: true, error: null }));
    try {
      await fn();
      await load();
      state.update((s) => ({ ...s, saving: false }));
    } catch (e) {
      if (e instanceof AuthError) {
        state.update((s) => ({ ...s, saving: false, authRequired: true }));
      } else {
        state.update((s) => ({ ...s, saving: false, error: e.message }));
      }
    }
  }

  return {
    state,
    load,
    reload: load,

    addInvestment(fields) {
      return mutate(() => api.createAsset(fields));
    },

    updateInvestment(id, fields) {
      return mutate(() => api.patchAsset(id, fields));
    },

    deleteInvestment(id) {
      return mutate(() => api.deleteAsset(id));
    },

    addUpdate(id, { date, amount }) {
      return mutate(() =>
        api.postUpdates([{ asset_id: id, date, amount: Number(amount) }])
      );
    },

    applyCheckIn(updates) {
      return mutate(() =>
        api.postUpdates(
          updates.map(({ id, date, amount }) => ({
            asset_id: id,
            date,
            amount: Number(amount),
          }))
        )
      );
    },

    addType(name, exclude = false) {
      return mutate(() => api.addType(name, exclude));
    },

    updateType(idx, fields) {
      const name = current.data.metadata.investment_types[idx].name;
      return mutate(() => api.patchType(name, fields));
    },
  };
}
