import { describe, it, expect } from 'vitest';
import { isStale } from '../../src/lib/domain/staleness.js';

const NOW = new Date('2024-06-15T00:00:00Z');

describe('isStale', () => {
  it('is stale when the last update is older than the threshold', () => {
    const inv = { is_active: true, updates: [{ date: '2024-01-01', amount: 1 }] };
    expect(isStale(inv, 3, NOW)).toBe(true);
  });

  it('is fresh when updated within the threshold', () => {
    const inv = { is_active: true, updates: [{ date: '2024-05-01', amount: 1 }] };
    expect(isStale(inv, 3, NOW)).toBe(false);
  });

  it('falls back to start_date when there are no updates', () => {
    const inv = { is_active: true, start_date: '2023-01-01', updates: [] };
    expect(isStale(inv, 3, NOW)).toBe(true);
  });

  it('is never stale when the asset opted out of the reminder', () => {
    const inv = {
      is_active: true,
      staleness_reminder: false,
      updates: [{ date: '2020-01-01', amount: 1 }],
    };
    expect(isStale(inv, 3, NOW)).toBe(false);
  });

  it('defaults to reminding when staleness_reminder is absent', () => {
    const inv = { is_active: true, updates: [{ date: '2020-01-01', amount: 1 }] };
    expect(isStale(inv, 3, NOW)).toBe(true);
  });

  it('inactive investments are never stale', () => {
    const inv = { is_active: false, updates: [{ date: '2020-01-01', amount: 1 }] };
    expect(isStale(inv, 3, NOW)).toBe(false);
  });
});
