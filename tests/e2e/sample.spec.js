import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * Sample E2E test to verify Playwright setup
 * This test verifies the basic page loads correctly
 */
test.describe('Sample E2E Test', () => {
  test('should load the application page', async ({ page }) => {
    // Navigate to the application using file:// protocol
    const indexPath = join(projectRoot, 'index.html');
    
    // Check if file exists
    if (!existsSync(indexPath)) {
      test.skip('index.html not found at expected path');
      return;
    }
    
    // Use file:// protocol for local static files
    await page.goto(`file://${indexPath}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page title or main content
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Verify main heading exists (h1 with "Money Management")
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});
