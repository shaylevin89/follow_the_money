import { describe, it, expect } from 'vitest';
import {
  isLoanType,
  normalizeDate,
  findDuplicate,
  currentAmount,
  activeInvestments,
  lastUpdate,
} from '../../src/lib/domain/investments.js';
import { sampleData } from './fixtures/sample-data.js';

describe('isLoanType', () => {
  it('detects loan types case-insensitively', () => {
    expect(isLoanType('real_estate_loan')).toBe(true);
    expect(isLoanType('B2B_LOAN')).toBe(true);
    expect(isLoanType('stocks')).toBe(false);
    expect(isLoanType(null)).toBe(false);
    expect(isLoanType(undefined)).toBe(false);
  });
});

describe('normalizeDate', () => {
  it('keeps YYYY-MM-DD as-is', () => {
    expect(normalizeDate('2024-03-20')).toBe('2024-03-20');
  });
  it('normalizes parseable dates', () => {
    expect(normalizeDate('2024-03-20T12:00:00Z')).toBe('2024-03-20');
  });
  it('returns null for empty or invalid input', () => {
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate('not-a-date')).toBeNull();
  });
});

describe('findDuplicate', () => {
  const investments = sampleData().investments;
  it('finds duplicate by case-insensitive name and start date', () => {
    const dup = findDuplicate(investments, '  training fund a ', '2020-01-01');
    expect(dup).not.toBeNull();
    expect(dup.id).toBe('fund1');
  });
  it('ignores the excluded id (editing case)', () => {
    expect(findDuplicate(investments, 'Training Fund A', '2020-01-01', 'fund1')).toBeNull();
  });
  it('returns null when name or date missing or no match', () => {
    expect(findDuplicate(investments, '', '2020-01-01')).toBeNull();
    expect(findDuplicate(investments, 'Training Fund A', null)).toBeNull();
    expect(findDuplicate(investments, 'Training Fund A', '2021-01-01')).toBeNull();
  });
});

describe('currentAmount', () => {
  it('prefers current_amount, falls back to initial_amount', () => {
    expect(currentAmount({ current_amount: 5, initial_amount: 3 })).toBe(5);
    expect(currentAmount({ initial_amount: 3 })).toBe(3);
  });
  it('treats 0 current_amount as a real value', () => {
    expect(currentAmount({ current_amount: 0, initial_amount: 30000 })).toBe(0);
  });
});

describe('activeInvestments', () => {
  it('filters to active only', () => {
    const active = activeInvestments(sampleData().investments);
    expect(active.map((i) => i.id)).toEqual(['usa1', 'fund1', 'pension1']);
  });
});

describe('lastUpdate', () => {
  it('returns the latest update by date', () => {
    const inv = sampleData().investments[1];
    expect(lastUpdate(inv)).toEqual({ date: '2022-01-01', amount: 13000 });
  });
  it('returns null when no updates', () => {
    expect(lastUpdate({ updates: [] })).toBeNull();
    expect(lastUpdate({})).toBeNull();
  });
});
