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

// Value of one investment at a date: carry-forward of its latest update,
// 0 before its first update, and 0 after the final update of an inactive
// investment (its money moved elsewhere).
function valueAtDate(inv, date, usdToIlsRate) {
  const all = (inv.updates || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (all.length === 0) return 0;
  if (inv.is_active === false && date > all[all.length - 1].date) return 0;
  const past = all.filter((u) => u.date <= date);
  if (past.length === 0) return 0;
  return toIls(past[past.length - 1].amount, inv.currency, usdToIlsRate);
}

// Year-end value per investment type. Types beyond maxSeries (ranked by
// final-year value) fold into 'Other'.
export function typeHistoryByYear(investments, usdToIlsRate, { maxSeries = 7, now = new Date() } = {}) {
  const allDates = investments.flatMap((inv) => (inv.updates || []).map((u) => u.date));
  if (allDates.length === 0) return { years: [], series: [] };

  const firstYear = Number(allDates.sort()[0].slice(0, 4));
  const lastYear = now.getFullYear();
  const years = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);

  const totalsByType = new Map();
  for (const year of years) {
    const cutoff = `${year}-12-31`;
    for (const inv of investments) {
      const value = valueAtDate(inv, cutoff, usdToIlsRate);
      if (value === 0 && !totalsByType.has(inv.investment_type)) continue;
      if (!totalsByType.has(inv.investment_type)) {
        totalsByType.set(inv.investment_type, new Array(years.length).fill(0));
      }
      totalsByType.get(inv.investment_type)[years.indexOf(year)] += value;
    }
  }

  const ranked = [...totalsByType.entries()]
    .map(([type, values]) => ({ type, values: values.map(Math.round) }))
    .filter((s) => s.values.some((v) => v > 0))
    .sort((a, b) => b.values[b.values.length - 1] - a.values[a.values.length - 1]);

  if (ranked.length <= maxSeries) return { years, series: ranked };

  const top = ranked.slice(0, maxSeries - 1);
  const other = {
    type: 'Other',
    values: years.map((_, i) =>
      ranked.slice(maxSeries - 1).reduce((sum, s) => sum + s.values[i], 0)
    ),
  };
  return { years, series: [...top, other] };
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
