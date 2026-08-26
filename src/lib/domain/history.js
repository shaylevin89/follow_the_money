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
      const updates = (inv.updates || []).filter((u) => u.date <= date);
      if (updates.length === 0) continue; // not started yet at this date
      const latest = updates.sort((a, b) => a.date.localeCompare(b.date))[updates.length - 1];
      total += toIls(latest.amount, inv.currency, usdToIlsRate);
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
