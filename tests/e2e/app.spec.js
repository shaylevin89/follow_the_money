import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';

test.describe('token gate', () => {
  test('asks for a token when none is stored, then loads the app', async ({ page }) => {
    await page.route('https://api.exchangerate-api.com/**', (route) =>
      route.fulfill({ json: { rates: { ILS: 3.5 } } })
    );
    const { e2eData } = await import('./mocks.js');
    await page.route('https://api.github.com/repos/**/contents/data.json', (route) =>
      route.fulfill({
        json: {
          content: Buffer.from(JSON.stringify(e2eData()), 'utf-8').toString('base64'),
          sha: 's0',
        },
      })
    );

    await page.goto('/');
    await expect(page.getByText('Connect to GitHub')).toBeVisible();
    await page.getByLabel(/personal access token/i).fill('my-token');
    await page.getByRole('button', { name: /save token/i }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('dashboard', () => {
  test('shows totals and profit breakdown', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');
    // total: 35000*3.5 + 13000 = 135,500
    await expect(page.getByText('₪135,500')).toBeVisible();
    await page.getByRole('button', { name: /monthly profit/i }).click();
    await expect(page.getByText('USA Real Estate Loan 1')).toBeVisible();
  });
});

test.describe('assets', () => {
  test('lists, filters, and opens an asset', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await expect(page.getByText('Training Fund A')).toBeVisible();

    await page.getByRole('button', { name: /filter & sort/i }).click();
    await page.getByRole('checkbox', { name: 'Training_fund' }).check();
    await page.getByRole('button', { name: /apply/i }).click();
    await expect(page.getByText('USA Real Estate Loan 1')).not.toBeVisible();
    await expect(page.getByText(/filtered total/i)).toBeVisible();

    await page.getByText('Training Fund A').click();
    await expect(page.getByText(/since start/)).toBeVisible();
  });

  test('adds a new asset (saved via one commit)', async ({ page }) => {
    const { puts } = await installMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await page.getByRole('button', { name: /add asset/i }).click();

    await page.getByRole('textbox', { name: 'Name' }).fill('Gold Coins');
    await page.getByRole('combobox', { name: 'Type', exact: true }).selectOption('stocks');
    await page.getByRole('spinbutton', { name: 'Initial amount' }).fill('2500');
    await page.getByRole('textbox', { name: 'Start date' }).fill('2024-01-15');
    await page.getByRole('button', { name: /add asset/i }).click();

    await expect(page.getByText('Gold Coins')).toBeVisible();
    expect(puts).toHaveLength(1);
    const saved = puts[0];
    expect(saved.message).toBe('Update investment data');
    const { decodeContent } = await import('./mocks.js');
    const data = decodeContent(saved.content);
    const added = data.investments.find((i) => i.name === 'Gold Coins');
    expect(added.updates).toEqual([{ date: '2024-01-15', amount: 2500 }]);
  });

  test('adds a value update from the detail view', async ({ page }) => {
    const { puts } = await installMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await page.getByText('Training Fund A').click();

    await page.getByLabel(/new amount/i).fill('14200');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Value updated')).toBeVisible();

    const { decodeContent } = await import('./mocks.js');
    const data = decodeContent(puts.at(-1).content);
    expect(data.investments.find((i) => i.id === 'fund1').current_amount).toBe(14200);
  });
});

test.describe('check-in', () => {
  test('bulk updates changed assets in a single commit', async ({ page }) => {
    const { puts } = await installMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Check-in' }).click();

    await page.getByLabel(/new value for Training Fund A/i).fill('15000');
    await page.getByLabel(/new value for USA Real Estate Loan 1/i).fill('36000');
    await page.getByRole('button', { name: /save all/i }).click();

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(puts).toHaveLength(1);
    const { decodeContent } = await import('./mocks.js');
    const data = decodeContent(puts[0].content);
    expect(data.investments.find((i) => i.id === 'fund1').current_amount).toBe(15000);
    expect(data.investments.find((i) => i.id === 'usa1').current_amount).toBe(36000);
  });
});

test.describe('conflict handling', () => {
  test('shows a reload banner when the save conflicts', async ({ page }) => {
    await installMocks(page, { failFirstPutWith: 409 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await page.getByText('Training Fund A').click();
    await page.getByLabel(/new amount/i).fill('9999');
    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByText(/data changed elsewhere/i)).toBeVisible();
    await page.getByRole('button', { name: /reload/i }).click();
    await expect(page.getByText(/data changed elsewhere/i)).not.toBeVisible();
  });
});
