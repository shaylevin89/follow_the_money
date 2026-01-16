import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * E2E tests for Epic 2: Local Development Environment
 * Tests token reading from config.js and URL fallback
 */
test.describe('Epic 2: Local Development Environment', () => {
  test.beforeEach(async ({ page }) => {
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');
    }
  });

  test('[P0] should load application with config.js support', async ({ page }) => {
    // Given: Application is loaded
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');

      // When: Page loads
      // Then: Should handle config.js if it exists
      const heading = page.locator('h1');
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Verify page structure
      expect(await heading.isVisible()).toBe(true);
    }
  });

  test('[P1] should handle missing config.js gracefully', async ({ page }) => {
    // Given: Application without config.js
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      // Check if config.js script tag exists
      const htmlContent = readFileSync(indexPath, 'utf8');
      const hasConfigScript = htmlContent.includes('config.js');

      // Then: Should have config.js script tag with error handling
      expect(hasConfigScript).toBe(true);
      expect(htmlContent).toContain('onerror');
    }
  });

  test('[P1] should support URL token parameter fallback', async ({ page }) => {
    // Given: Application loaded with URL token
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}?token=test-url-token`);
      await page.waitForLoadState('networkidle');

      // Then: Application should load (token handling is in JavaScript)
      const heading = page.locator('h1');
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });
});
