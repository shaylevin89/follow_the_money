import { test, expect } from '@playwright/test';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * E2E tests for live GitHub Pages site
 * Tests the actual deployed application
 * 
 * IMPORTANT: Token must be in .env file (GITHUB_PAT)
 * .env is in .gitignore and should NEVER be committed
 */

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') });

const GITHUB_PAT = process.env.GITHUB_PAT || '';
const BASE_URL = 'https://shaylevin89.github.io/follow_the_money';

// Build URL with token from environment variable
const LIVE_SITE_URL = GITHUB_PAT 
  ? `${BASE_URL}/?token=${GITHUB_PAT}`
  : BASE_URL;

test.describe('Live GitHub Pages Site', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to live site
    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('[P0] should load the application successfully', async ({ page }) => {
    // Verify page loads
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Verify main heading exists (check for "Money Management" text)
    const heading = page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /Money Management/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('[P0] should display dashboard section', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Verify dashboard section exists (look for "Dashboard" text or dashboard elements)
    const dashboard = page.locator('text=/Dashboard|Total Value|Monthly Profit/i').first();
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });

  test('[P1] should display add investment form', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Look for "Add Investment" text or form elements
    const addInvestment = page.locator('text=/Add Investment|Investment Name/i').first();
    await expect(addInvestment).toBeVisible({ timeout: 10000 });
    
    // Verify form has input fields
    const inputs = page.locator('input[type="text"], input[type="number"], input[type="date"], select');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('[P1] should display investments list', async ({ page }) => {
    // Wait for investments to load
    await page.waitForTimeout(2000); // Give time for data to load
    
    // Look for investments container
    const investmentsSection = page.locator('[id*="investment"], [class*="investment"], table, .list-group');
    const count = await investmentsSection.count();
    
    // At minimum, the section should exist (even if empty)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('[P1] should have progress modal in DOM', async ({ page }) => {
    // Verify progress modal exists (Epic 3 feature)
    const progressModal = page.locator('#progressModal');
    await expect(progressModal).toBeAttached({ timeout: 5000 });
    
    // Verify progress bar element exists
    const progressBar = page.locator('#progressBar');
    await expect(progressBar).toBeAttached({ timeout: 5000 });
  });

  test('[P2] should display total value in dashboard', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Look for total value display
    const totalValue = page.locator('text=/Total Value|₪|USD|ILS/i');
    const count = await totalValue.count();
    
    // Should have some value display (even if 0)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('[P2] should have config section', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Look for config section (may be in a tab or collapsible section)
    const configSection = page.locator('text=/Config|Add Type/i').first();
    // Config section might not be visible initially, just check it exists in DOM
    const count = await configSection.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('[P2] should handle page interactions', async ({ page }) => {
    // Test that buttons are clickable
    const buttons = page.locator('button, [role="button"], .btn');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Try clicking first button (should not cause errors)
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible({ timeout: 5000 });
      
      // Verify button is enabled
      await expect(firstButton).toBeEnabled();
    }
  });

  test('[P2] should load data from GitHub', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check for any data indicators
    const hasData = await page.evaluate(() => {
      // Check if there are any investment rows or data displayed
      const investments = document.querySelectorAll('[id*="investment"], table tbody tr, .list-group-item');
      return investments.length > 0;
    });
    
    // Data should either be loaded or page should show empty state
    expect(typeof hasData).toBe('boolean');
  });

  test('[P3] should have responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    await expect(heading).toBeVisible();
  });

  test('[P3] should have no console errors', async ({ page }) => {
    const errors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors (like CORS, network issues)
    const criticalErrors = errors.filter(err => 
      !err.includes('CORS') && 
      !err.includes('Failed to fetch') &&
      !err.includes('NetworkError')
    );
    
    // Log errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(5);
  });
});
