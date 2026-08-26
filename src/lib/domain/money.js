// Currency conversion and formatting. No DOM, no Svelte.
import { activeInvestments, currentAmount } from './investments.js';

export function toIls(amount, currency, usdToIlsRate) {
  if (currency === 'ILS') return amount;
  if (currency === 'USD') return amount * usdToIlsRate;
  return 0;
}

export function formatNumber(number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatIls(number) {
  return `₪${formatNumber(number)}`;
}

export function totalValueIls(investments, usdToIlsRate) {
  return activeInvestments(investments).reduce(
    (sum, inv) => sum + toIls(currentAmount(inv), inv.currency, usdToIlsRate),
    0
  );
}
