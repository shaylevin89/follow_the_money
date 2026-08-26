// Filtering, sorting and summing of investment lists. Pure functions.
import { currentAmount } from './investments.js';
import { toIls } from './money.js';

export function filterByTypes(investments, types) {
  if (!types || types.length === 0) return investments;
  return investments.filter((inv) => types.includes(inv.investment_type));
}

export function sortInvestments(investments, by, dir = 'asc') {
  const mul = dir === 'desc' ? -1 : 1;
  return investments.slice().sort((a, b) => {
    let cmp;
    switch (by) {
      case 'current_amount':
        cmp = currentAmount(a) - currentAmount(b);
        break;
      case 'start_date':
        cmp = (a.start_date || '').localeCompare(b.start_date || '');
        break;
      case 'investment_type':
        cmp = (a.investment_type || '').localeCompare(b.investment_type || '');
        break;
      case 'name':
      default:
        cmp = (a.name || '').localeCompare(b.name || '');
    }
    return cmp * mul;
  });
}

export function sumIls(investments, usdToIlsRate) {
  return investments.reduce(
    (sum, inv) => sum + toIls(currentAmount(inv), inv.currency, usdToIlsRate),
    0
  );
}
