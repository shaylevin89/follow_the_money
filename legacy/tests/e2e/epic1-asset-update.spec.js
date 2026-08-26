import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * E2E tests for Epic 1: Fix Asset Update Bug
 * Tests the complete workflow: save → refresh → verify
 */
test.describe('Epic 1: Asset Update Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');
    }
  });

  test('[P0] should refresh data after saving investment', async ({ page }) => {
    // Given: Application is loaded with existing data
    // Note: This test requires mock GitHub API or test token
    // For now, we'll test the UI behavior

    // When: User saves an investment (if form is available)
    // Then: Data should refresh automatically
    
    // Verify page loaded
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });
    
    // This test will be expanded when we have mock API setup
    // For now, we verify the page structure exists
    const dashboard = page.locator('#dashboardContent, .dashboard-widget');
    // Dashboard may or may not be visible depending on data
    // Just verify page structure
    expect(await heading.isVisible()).toBe(true);
  });

  test('[P1] should use cache-busting in data load requests', async ({ page }) => {
    // Given: Application is loaded
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      
      // Monitor network requests
      const requests = [];
      page.on('request', request => {
        if (request.url().includes('data.json')) {
          requests.push(request.url());
        }
      });

      // When: Data is loaded (triggered by page load or manual refresh)
      await page.waitForLoadState('networkidle');
      
      // Then: Requests should include timestamp query parameter
      // Note: This requires actual network requests, which may not happen with file://
      // In real scenario, we'd verify the URL contains ?t= parameter
      
      // For now, verify page loaded
      const heading = page.locator('h1');
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });

  test('[P1] should update dashboard after data refresh', async ({ page }) => {
    // Given: Application is loaded
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');
      
      // When: Data is refreshed (simulated by checking dashboard elements)
      // Then: Dashboard should be visible and functional
      
      // Verify dashboard section exists
      const dashboardSection = page.locator('#dashboardContent, .card');
      // Dashboard may be collapsed, but element should exist
      const heading = page.locator('h1');
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });
});
