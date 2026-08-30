import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative base so the bundle works on GitHub Pages subpaths and Cloudflare Pages alike.
  base: './',
  plugins: [
    svelte(),
    svelteTesting(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Follow the Money',
        short_name: 'Money',
        description: 'Personal investment portfolio tracker',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The API must always hit the network — never the service worker cache.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
    setupFiles: ['tests/unit/setup.js'],
    globals: true,
  },
});
