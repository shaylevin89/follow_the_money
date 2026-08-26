// Form-level validation for creating/editing an investment.
import { findDuplicate, normalizeDate } from './investments.js';

export function validateInvestment(fields, investments, excludeId = null, now = new Date()) {
  const errors = {};

  if (!fields.name || !fields.name.trim()) {
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
  } else if (new Date(startDate) > now) {
    errors.start_date = 'Start date cannot be in the future';
  }

  if (!errors.name && startDate) {
    const dup = findDuplicate(investments, fields.name, startDate, excludeId);
    if (dup) {
      errors.name = 'An investment with this name and start date already exists';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
