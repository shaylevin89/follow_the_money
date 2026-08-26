import { describe, it, expect } from 'vitest';

/**
 * Sample unit test to verify Vitest setup
 * This test verifies basic JavaScript functionality
 */
describe('Sample Unit Test', () => {
  it('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });

  it('should handle string operations', () => {
    const str = 'Hello';
    expect(str.toUpperCase()).toBe('HELLO');
    expect(str.length).toBe(5);
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });
});
