import { describe, it, expect } from 'vitest';
import { buildSql } from '../../scripts/migrate-data.mjs';

function fixture(overrides = {}) {
  return {
    version: '1.0',
    investments: [
      {
        id: "o'brien-1",
        name: "O'Brien Fund",
        is_active: true,
        track_profit: true,
        start_date: '2020-01-01',
        initial_amount: 1000,
        currency: 'ILS',
        profit_type: 'price',
        notes: '',
        is_liquid: false,
        investment_type: 'stocks',
        liquidity_date: null,
        profit_rate: 5.5,
        staleness_reminder: true,
        updates: [
          { date: '2020-01-01', amount: 1000 },
          { date: '2020-06-01', amount: 1100 },
        ],
      },
      {
        id: 'plain-2',
        name: 'Plain Asset',
        is_active: false,
        track_profit: false,
        start_date: '2021-03-04',
        initial_amount: 500,
        currency: 'USD',
        profit_type: 'other',
        notes: 'some notes',
        is_liquid: true,
        investment_type: 'crypto',
        liquidity_date: '2022-01-01',
        updates: [{ date: '2021-03-04', amount: 500 }],
      },
    ],
    metadata: {
      currencies: ['ILS', 'USD'],
      profit_types: ['price', 'commission', 'other'],
      investment_types: [
        { name: "type's name", exclude_periodical_profit: true },
        { name: 'plain_type', exclude_periodical_profit: false },
      ],
    },
    ...overrides,
  };
}

describe('buildSql', () => {
  it('emits DELETE statements before any INSERT statements', () => {
    const { sql } = buildSql(fixture());
    const lines = sql.split('\n').filter((l) => l.trim().startsWith('DELETE') || l.trim().startsWith('INSERT'));
    const firstInsertIndex = lines.findIndex((l) => l.startsWith('INSERT'));
    const deleteLines = lines.filter((l) => l.startsWith('DELETE'));

    expect(deleteLines).toEqual([
      'DELETE FROM asset_updates;',
      'DELETE FROM assets;',
      'DELETE FROM investment_types;',
    ]);
    // every DELETE line appears before the first INSERT line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('DELETE')) {
        expect(i).toBeLessThan(firstInsertIndex);
      }
    }
  });

  it('escapes single quotes in names by doubling them', () => {
    const { sql } = buildSql(fixture());
    expect(sql).toContain("VALUES ('o''brien-1', 'O''Brien Fund'");
    expect(sql).toContain("INSERT INTO investment_types (name, exclude_periodical_profit) VALUES ('type''s name', 1);");
  });

  it('emits one INSERT into asset_updates per update row, across all investments', () => {
    const { sql, counts } = buildSql(fixture());
    const updateInserts = sql.split('\n').filter((l) => l.startsWith('INSERT INTO asset_updates'));
    expect(updateInserts).toHaveLength(3); // 2 + 1
    expect(counts.asset_updates).toBe(3);
    expect(updateInserts[0]).toBe(
      "INSERT INTO asset_updates (asset_id, date, amount, created_by) VALUES ('o''brien-1', '2020-01-01', 1000, NULL);"
    );
    expect(updateInserts[2]).toBe(
      "INSERT INTO asset_updates (asset_id, date, amount, created_by) VALUES ('plain-2', '2021-03-04', 500, NULL);"
    );
  });

  it('maps booleans to 0/1 for assets and investment_types', () => {
    const { sql } = buildSql(fixture());
    // investment 1: is_active true, track_profit true, is_liquid false, staleness_reminder true
    expect(sql).toContain(
      "INSERT INTO assets (id, name, investment_type, currency, start_date, initial_amount, profit_type, profit_rate, is_active, is_liquid, liquidity_date, track_profit, staleness_reminder, notes, deleted_at) VALUES ('o''brien-1', 'O''Brien Fund', 'stocks', 'ILS', '2020-01-01', 1000, 'price', 5.5, 1, 0, NULL, 1, 1, '', NULL);"
    );
    // investment 2: is_active false, track_profit false, is_liquid true, no profit_rate, no staleness_reminder given -> defaults true
    expect(sql).toContain(
      "INSERT INTO assets (id, name, investment_type, currency, start_date, initial_amount, profit_type, profit_rate, is_active, is_liquid, liquidity_date, track_profit, staleness_reminder, notes, deleted_at) VALUES ('plain-2', 'Plain Asset', 'crypto', 'USD', '2021-03-04', 500, 'other', NULL, 0, 1, '2022-01-01', 0, 1, 'some notes', NULL);"
    );
  });

  it('reports accurate row counts', () => {
    const { counts } = buildSql(fixture());
    expect(counts).toEqual({ investment_types: 2, assets: 2, asset_updates: 3 });
  });

  it('handles an investment with no updates', () => {
    const data = fixture();
    data.investments.push({
      id: 'no-updates',
      name: 'No Updates Yet',
      is_active: true,
      track_profit: false,
      start_date: '2023-01-01',
      initial_amount: 10,
      currency: 'ILS',
      profit_type: 'price',
      investment_type: 'bank',
      updates: [],
    });
    const { counts } = buildSql(data);
    expect(counts.assets).toBe(3);
    expect(counts.asset_updates).toBe(3);
  });
});
