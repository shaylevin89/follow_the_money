import { describe, it, expect } from 'vitest';
import { toIls, formatNumber, formatIls, totalValueIls } from '../../src/lib/domain/money.js';
import { sampleData } from './fixtures/sample-data.js';

describe('toIls', () => {
  it('passes ILS through', () => {
    expect(toIls(100, 'ILS', 3.7)).toBe(100);
  });
  it('converts USD at the given rate', () => {
    expect(toIls(100, 'USD', 3.7)).toBeCloseTo(370);
  });
  it('returns 0 for unknown currency', () => {
    expect(toIls(100, 'EUR', 3.7)).toBe(0);
  });
});

describe('formatNumber', () => {
  it('formats with thousands separators, no decimals', () => {
    expect(formatNumber(1234567.89)).toBe('1,234,568');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatIls', () => {
  it('prefixes the shekel sign', () => {
    expect(formatIls(1500)).toBe('₪1,500');
  });
});

describe('totalValueIls', () => {
  it('sums active investments converted to ILS', () => {
    const { investments } = sampleData();
    // usa1: 35000 USD * 4 = 140000, fund1: 13000, pension1: 60000; dead1 inactive
    expect(totalValueIls(investments, 4)).toBeCloseTo(140000 + 13000 + 60000);
  });
});
