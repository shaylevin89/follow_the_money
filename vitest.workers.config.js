// @cloudflare/vitest-pool-workers 0.22.x (paired with vitest ^4.1) replaced the
// old `defineWorkersConfig` export with a `cloudflareTest` Vite plugin that
// reads bindings straight from wrangler.toml. Kept separate from
// vite.config.js's `test` block (tests/unit/**) so unit tests are unaffected.
import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
    }),
  ],
  test: {
    include: ['tests/workers/**/*.test.js'],
  },
});
