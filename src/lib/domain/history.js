// Portfolio and per-asset value history, built from each investment's updates.
import { toIls } from './money.js';

export function portfolioHistory(investments, usdToIlsRate) {
  const dates = new Set();
  for (const inv of investments) {
    for (const u of inv.updates || []) dates.add(u.date);
  }
  const sortedDates = [...dates].sort();

  return sortedDates.map((date) => {
    let total = 0;
    for (const inv of investments) {
      const all = (inv.updates || []).slice().sort((a, b) => a.date.localeCompare(b.date));
      if (all.length === 0) continue;
      // An inactive investment's money moved elsewhere after its final update —
      // counting it beyond that date would double-count the portfolio.
      if (inv.is_active === false && date > all[all.length - 1].date) continue;
      const past = all.filter((u) => u.date <= date);
      if (past.length === 0) continue; // not started yet at this date
      total += toIls(past[past.length - 1].amount, inv.currency, usdToIlsRate);
    }
    return { date, total };
  });
}

export function assetHistory(inv, usdToIlsRate) {
  return (inv.updates || [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((u) => ({
      date: u.date,
      amount: u.amount,
      amountIls: toIls(u.amount, inv.currency, usdToIlsRate),
    }));
}
