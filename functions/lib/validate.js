// Server-side mirror of src/lib/domain/validation.js rules, for the
// Pages Functions asset mutation endpoints. Kept dependency-free (no
// import from src/) since Workers bundle only functions/.

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDate(date) {
  if (!date) return null;
  if (typeof date === 'string' && ISO_DATE_RE.test(date)) return date;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function findDuplicate(existingAssets, name, startDate, excludeId) {
  if (!name || !name.trim() || !startDate) return null;
  const nameLower = name.trim().toLowerCase();
  return (
    existingAssets.find((asset) => {
      if (excludeId && asset.id === excludeId) return false;
      return (asset.name || '').trim().toLowerCase() === nameLower && asset.start_date === startDate;
    }) || null
  );
}

/**
 * Validates fields for creating/editing an asset, mirroring
 * src/lib/domain/validation.js's validateInvestment.
 *
 * @param {object} fields
 * @param {Array<{id: string, name: string, start_date: string}>} existingAssets - non-deleted assets
 * @param {string|null} excludeId - asset id to exclude from the duplicate check (edits)
 * @returns {{valid: boolean, errors: object, normalized: {start_date: string|null}}}
 */
export function validateAssetFields(fields, existingAssets, excludeId = null) {
  const errors = {};

  if (!fields.name || !String(fields.name).trim()) {
    errors.name = 'Name is required';
  }
  if (!fields.investment_type) {
    errors.investment_type = 'Type is required';
  }
  if (!fields.currency) {
    errors.currency = 'Currency is required';
  }
  if (!fields.profit_type) {
    errors.profit_type = 'Profit type is required';
  }

  const amount = Number(fields.initial_amount);
  if (fields.initial_amount === '' || fields.initial_amount == null || isNaN(amount) || amount <= 0) {
    errors.initial_amount = 'Amount must be a positive number';
  }

  const startDate = normalizeDate(fields.start_date);
  if (!startDate) {
    errors.start_date = 'Start date is required';
  } else if (new Date(startDate) > new Date()) {
    errors.start_date = 'Start date cannot be in the future';
  }

  if (!errors.name && startDate) {
    const dup = findDuplicate(existingAssets, fields.name, startDate, excludeId);
    if (dup) {
      errors.name = 'An investment with this name and start date already exists';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, normalized: { start_date: startDate } };
}
