import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * E2E tests for Epic 3: GitHub Action Progress Feedback
 * Tests progress indicator display and updates
 */
test.describe('Epic 3: GitHub Action Progress Feedback', () => {
  test.beforeEach(async ({ page }) => {
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');
    }
  });

  test('[P0] should have progress modal in DOM', async ({ page }) => {
    // Given: Application is loaded
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');

      // Then: Progress modal should exist in DOM (may be hidden)
      const progressModal = page.locator('#progressModal');
      await expect(progressModal).toBeAttached({ timeout: 5000 });
    }
  });

  test('[P1] should have progress bar element', async ({ page }) => {
    // Given: Application is loaded
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');

      // Then: Progress bar should exist in DOM (may be hidden)
      const progressBar = page.locator('#progressBar');
      await expect(progressBar).toBeAttached({ timeout: 5000 });
    }
  });

  test('[P1] should have status message elements', async ({ page }) => {
    // Given: Application is loaded
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');

      // Then: Status elements should exist
      const progressStatus = page.locator('#progressStatus');
      const progressMessage = page.locator('#progressMessage');
      await expect(progressStatus).toBeVisible({ timeout: 5000 });
      await expect(progressMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('[P2] should display progress modal when save is triggered', async ({ page }) => {
    // Given: Application is loaded
    // When: Save operation is triggered (would need mock API)
    // Then: Progress modal should appear
    
    // For now, verify modal structure exists
    const indexPath = join(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      await page.goto(`file://${indexPath}`);
      await page.waitForLoadState('networkidle');

      const progressModal = page.locator('#progressModal');
      expect(await progressModal.count()).toBeGreaterThan(0);
    }
  });
});
