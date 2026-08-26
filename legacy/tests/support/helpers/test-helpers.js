/**
 * Test helper utilities
 * Common functions for use across tests
 */

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns true when condition is met
 * @param {number} timeout - Maximum time to wait in ms
 * @param {number} interval - Polling interval in ms
 * @returns {Promise<void>}
 */
export async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate test data for investments
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Investment object
 */
export function createTestInvestment(overrides = {}) {
  return {
    id: Date.now(),
    name: 'Test Investment',
    type: 'stock',
    initial_amount: 1000,
    current_amount: 1200,
    currency: 'USD',
    start_date: new Date().toISOString().split('T')[0],
    is_active: true,
    is_liquid: true,
    profit_type: 'price',
    ...overrides,
  };
}

/**
 * Mock GitHub API response
 * @param {Object} data - Data to return
 * @returns {Object} Mock response object
 */
export function mockGitHubResponse(data) {
  return {
    ok: true,
    json: async () => data,
    status: 200,
  };
}
