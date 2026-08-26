// Periodical profit calculation, ported faithfully from the legacy app.
// periodDays: 30 (monthly) or 365 (yearly). `now` injected for testability.
import { isLoanType, currentAmount } from './investments.js';
import { formatNumber } from './money.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function profitBreakdown(investments, metadata, usdToIlsRate, periodDays, now = new Date()) {
  const excludedTypes = Array.isArray(metadata?.investment_types)
    ? metadata.investment_types
        .filter((t) => t.exclude_periodical_profit === true)
        .map((t) => t.name)
    : [];

  const details = [];
  let total = 0;

  investments
    .filter(
      (inv) =>
        inv.is_active && inv.track_profit && !excludedTypes.includes(inv.investment_type)
    )
    .forEach((inv) => {
      let profit = 0;
      let calculation = '';

      if (isLoanType(inv.investment_type) && typeof inv.profit_rate === 'number' && !isNaN(inv.profit_rate)) {
        const daysSinceStart = (now - new Date(inv.start_date)) / MS_PER_DAY;
        const amount = currentAmount(inv);
        // Annual rate scaled to the period (monthly = /12 of annual, yearly = full).
        const fullPeriod =
          periodDays === 365
            ? amount * (inv.profit_rate / 100)
            : (amount * (inv.profit_rate / 100)) / 12;
        if (daysSinceStart < periodDays) {
          profit = fullPeriod * (daysSinceStart / periodDays);
          calculation =
            periodDays === 365
              ? `${formatNumber(amount)} × ${inv.profit_rate}% × ${Math.round(daysSinceStart)}/365`
              : `${formatNumber(amount)} × ${inv.profit_rate}% ÷ 12 × ${Math.round(daysSinceStart)}/30`;
        } else {
          profit = fullPeriod;
          calculation =
            periodDays === 365
              ? `${formatNumber(amount)} × ${inv.profit_rate}%`
              : `${formatNumber(amount)} × ${inv.profit_rate}% ÷ 12`;
        }
        if (inv.currency === 'USD') {
          profit *= usdToIlsRate;
          calculation += ` × ${usdToIlsRate.toFixed(2)}`;
        }
      } else if (Array.isArray(inv.updates) && inv.updates.length >= 2) {
        const sorted = inv.updates.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const days = (new Date(last.date) - new Date(first.date)) / MS_PER_DAY;
        if (days > 0 && days < periodDays) {
          profit = last.amount - first.amount;
          calculation = `${formatNumber(last.amount)} - ${formatNumber(first.amount)} (${Math.round(days)}d)`;
        } else if (days > 0) {
          profit = ((last.amount - first.amount) / days) * periodDays;
          calculation = `(${formatNumber(last.amount)} - ${formatNumber(first.amount)}) ÷ ${Math.round(days)}d × ${periodDays}`;
        } else {
          profit = 0;
          calculation = 'No data';
        }
        if (inv.currency === 'USD') {
          profit *= usdToIlsRate;
          calculation += ` × ${usdToIlsRate.toFixed(2)}`;
        }
      } else {
        return;
      }

      details.push({
        name: inv.name,
        type: inv.investment_type,
        currency: inv.currency,
        calculation,
        profit,
      });
      total += profit;
    });

  return { total, details };
}
