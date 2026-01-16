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
      include: ['app.js'],
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
        'index.html',
        'data.json',
      ],
      // Coverage thresholds (relaxed for now, will increase as tests are added)
      thresholds: {
        lines: 20,  // Will increase as more tests are added
        functions: 20,
        branches: 20,
        statements: 20,
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
