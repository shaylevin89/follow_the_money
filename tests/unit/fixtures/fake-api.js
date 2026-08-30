// Fake API client for view tests. Mirrors the D1 backend's mutate-then-GET
// contract: mutations update in-memory state so a subsequent loadPortfolio()
// (issued by the store's reload-after-mutation) reflects the change.
import { vi } from 'vitest';

export function makeFakeApi(initialData) {
  let data = initialData;
  let nextId = 1000;

  const api = {
    loadPortfolio: vi.fn(async () => data),

    createAsset: vi.fn(async (fields) => {
      const amount = Number(fields.initial_amount);
      const investment = {
        id: `new${nextId++}`,
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
        staleness_reminder: fields.staleness_reminder ?? true,
        investment_type: fields.investment_type,
        liquidity_date: fields.liquidity_date || null,
        updates: [{ date: fields.start_date, amount }],
        ...(fields.profit_rate != null && fields.profit_rate !== ''
          ? { profit_rate: Number(fields.profit_rate) }
          : {}),
      };
      data = { ...data, investments: [...data.investments, investment] };
      return investment;
    }),

    patchAsset: vi.fn(async (id, fields) => {
      data = {
        ...data,
        investments: data.investments.map((inv) =>
          inv.id === id ? { ...inv, ...fields } : inv
        ),
      };
      return { ok: true };
    }),

    deleteAsset: vi.fn(async (id) => {
      data = { ...data, investments: data.investments.filter((inv) => inv.id !== id) };
      return { ok: true };
    }),

    postUpdates: vi.fn(async (items) => {
      data = {
        ...data,
        investments: data.investments.map((inv) => {
          const relevant = items.filter((it) => it.asset_id === inv.id);
          if (relevant.length === 0) return inv;
          const updates = [...(inv.updates || [])];
          for (const { date, amount } of relevant) {
            const existing = updates.find((u) => u.date === date);
            if (existing) existing.amount = amount;
            else updates.push({ date, amount });
          }
          updates.sort((a, b) => a.date.localeCompare(b.date));
          return { ...inv, updates, current_amount: updates[updates.length - 1].amount };
        }),
      };
      return { inserted: items.length };
    }),

    addType: vi.fn(async (name, exclude = false) => {
      const investment_types = [
        ...(data.metadata?.investment_types || []),
        { name, exclude_periodical_profit: exclude },
      ];
      data = { ...data, metadata: { ...data.metadata, investment_types } };
      return { name, exclude_periodical_profit: exclude };
    }),

    patchType: vi.fn(async (name, fields) => {
      const investment_types = (data.metadata?.investment_types || []).map((t) =>
        t.name === name ? { ...t, ...fields } : t
      );
      data = { ...data, metadata: { ...data.metadata, investment_types } };
      return { ok: true };
    }),
  };

  return api;
}
