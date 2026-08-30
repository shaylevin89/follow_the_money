// Small portfolio-level stats for the dashboard tiles.
import { activeInvestments, currentAmount } from './investments.js';
import { toIls } from './money.js';
import { isStale } from './staleness.js';

export function portfolioStats(investments, usdToIlsRate, stalenessMonths, now = new Date()) {
  const active = activeInvestments(investments);
  const total = active.reduce(
    (sum, inv) => sum + toIls(currentAmount(inv), inv.currency, usdToIlsRate),
    0
  );
  const liquid = active
    .filter((inv) => inv.is_liquid)
    .reduce((sum, inv) => sum + toIls(currentAmount(inv), inv.currency, usdToIlsRate), 0);
  return {
    activeCount: active.length,
    staleCount: active.filter((inv) => isStale(inv, stalenessMonths, now)).length,
    liquidPct: total > 0 ? (liquid / total) * 100 : 0,
  };
}
