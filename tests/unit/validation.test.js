import { describe, it, expect } from 'vitest';
import { validateInvestment } from '../../src/lib/domain/validation.js';
import { sampleData } from './fixtures/sample-data.js';

const NOW = new Date('2024-06-15T00:00:00Z');

function validFields(overrides = {}) {
  return {
    name: 'New Asset',
    investment_type: 'stocks',
    initial_amount: 1000,
    currency: 'ILS',
    start_date: '2024-01-01',
    profit_type: 'price',
    ...overrides,
  };
}

describe('validateInvestment', () => {
  const investments = sampleData().investments;

  it('accepts a valid investment', () => {
    const { valid, errors } = validateInvestment(validFields(), investments, null, NOW);
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  it('requires name, type, currency, profit_type, start_date', () => {
    const { valid, errors } = validateInvestment(
      validFields({ name: ' ', investment_type: '', currency: '', profit_type: '', start_date: '' }),
      investments,
      null,
      NOW
    );
    expect(valid).toBe(false);
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(['name', 'investment_type', 'currency', 'profit_type', 'start_date'])
    );
  });

  it('rejects non-positive or non-numeric amounts', () => {
    expect(validateInvestment(validFields({ initial_amount: 0 }), investments, null, NOW).errors.initial_amount).toBeTruthy();
    expect(validateInvestment(validFields({ initial_amount: 'abc' }), investments, null, NOW).errors.initial_amount).toBeTruthy();
    expect(validateInvestment(validFields({ initial_amount: -5 }), investments, null, NOW).errors.initial_amount).toBeTruthy();
  });

  it('rejects future start dates', () => {
    const { errors } = validateInvestment(validFields({ start_date: '2024-07-01' }), investments, null, NOW);
    expect(errors.start_date).toBeTruthy();
  });

  it('rejects duplicates by name + start date, unless editing the same id', () => {
    const dupFields = validFields({ name: 'Training Fund A', start_date: '2020-01-01' });
    expect(validateInvestment(dupFields, investments, null, NOW).errors.name).toContain('exists');
    expect(validateInvestment(dupFields, investments, 'fund1', NOW).valid).toBe(true);
  });
});
