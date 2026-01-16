import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for follow_the_money
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  test: {
    // Test files location
    include: ['tests/unit/**/*.test.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'load-env.js',
        'config.js',
        '.env',
        '_bmad/',
        '_bmad-output/',
        'docs/',
      ],
      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Global test setup
    globals: true,
    
    // Environment
    environment: 'jsdom',
  },
});
