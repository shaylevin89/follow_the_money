// Staleness: has an active investment gone too long without a value update?
import { lastUpdate } from './investments.js';

export function isStale(inv, thresholdMonths, now = new Date()) {
  if (!inv.is_active) return false;
  const latest = lastUpdate(inv);
  const refDate = latest ? latest.date : inv.start_date;
  if (!refDate) return false;
  const threshold = new Date(now);
  threshold.setMonth(threshold.getMonth() - thresholdMonths);
  return new Date(refDate) < threshold;
}
