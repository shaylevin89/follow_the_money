// Pure helpers over investment records. No DOM, no Svelte.

export function isLoanType(type) {
  return typeof type === 'string' && type.toLowerCase().includes('loan');
}

export function normalizeDate(date) {
  if (!date) return null;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export function findDuplicate(investments, name, startDate, excludeId = null) {
  if (!name || !name.trim() || !startDate) return null;
  const nameLower = name.trim().toLowerCase();
  return (
    investments.find((inv) => {
      if (excludeId && inv.id === excludeId) return false;
      return (inv.name || '').trim().toLowerCase() === nameLower && inv.start_date === startDate;
    }) || null
  );
}

export function currentAmount(inv) {
  return inv.current_amount ?? inv.initial_amount;
}

export function activeInvestments(investments) {
  return investments.filter((inv) => inv.is_active);
}

export function lastUpdate(inv) {
  const updates = inv.updates;
  if (!Array.isArray(updates) || updates.length === 0) return null;
  return updates.slice().sort((a, b) => new Date(a.date) - new Date(b.date))[updates.length - 1];
}
