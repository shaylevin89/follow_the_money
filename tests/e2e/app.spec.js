import { test, expect } from '@playwright/test';
import { installApiMocks } from './mocks.js';

test.describe('login', () => {
  test('shows the login screen when logged out, then reaches the dashboard', async ({ page }) => {
    await installApiMocks(page, { loggedIn: false });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.getByLabel('Username').fill('shay');
    await page.getByLabel('Password').fill('test1234');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('forced password change reaches the dashboard after submitting a new password', async ({ page }) => {
    await installApiMocks(page, { loggedIn: false, mustChangePassword: true });
    await page.goto('/');

    await page.getByLabel('Username').fill('shay');
    await page.getByLabel('Password').fill('test1234');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();

    await page.getByLabel('Current password').fill('test1234');
    await page.getByLabel('New password', { exact: true }).fill('new-password-1');
    await page.getByLabel('Confirm new password').fill('new-password-1');
    await page.getByRole('button', { name: /change password/i }).click();

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('wrong password shows an error', async ({ page }) => {
    await installApiMocks(page, { loggedIn: false });
    await page.goto('/');

    await page.getByLabel('Username').fill('shay');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(/invalid username or password/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});

test.describe('dashboard', () => {
  test('shows totals and profit breakdown', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/');
    // total: 35000*3.5 + 13000 = 135,500
    await expect(page.getByText('₪135,500')).toBeVisible();
    await page.getByRole('button', { name: /monthly profit/i }).click();
    await expect(page.getByText('USA Real Estate Loan 1')).toBeVisible();
  });
});

test.describe('assets', () => {
  test('lists, filters, and opens an asset', async ({ page }) => {
    await installApiMocks(page);
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

  test('adds a new asset', async ({ page }) => {
    const { posted } = await installApiMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await page.getByRole('button', { name: /add asset/i }).click();

    await page.getByRole('textbox', { name: 'Name' }).fill('Gold Coins');
    await page.getByRole('combobox', { name: 'Type', exact: true }).selectOption('stocks');
    await page.getByRole('spinbutton', { name: 'Initial amount' }).fill('2500');
    await page.getByRole('textbox', { name: 'Start date' }).fill('2024-01-15');
    await page.getByRole('button', { name: /add asset/i }).click();

    await expect(page.getByText('Gold Coins')).toBeVisible();
    // First-update seeding (the initial-amount update row) is done server-side
    // on POST /api/assets — the client just sends the form fields.
    expect(posted.assets).toHaveLength(1);
    expect(posted.assets[0]).toMatchObject({
      name: 'Gold Coins',
      investment_type: 'stocks',
      initial_amount: 2500,
      start_date: '2024-01-15',
    });
  });

  test('adds a value update from the detail view', async ({ page }) => {
    const { posted } = await installApiMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await page.getByText('Training Fund A').click();

    await page.getByLabel(/new amount/i).fill('14200');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Value updated')).toBeVisible();

    expect(posted.updates.at(-1)).toEqual([
      { asset_id: 'fund1', date: expect.any(String), amount: 14200 },
    ]);
  });

  test('edits an asset and persists the change via PATCH', async ({ page }) => {
    const { posted } = await installApiMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await page.getByText('Training Fund A').click();

    await page.getByRole('button', { name: /edit details/i }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('Training Fund A Renamed');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Asset updated')).toBeVisible();

    const last = posted.patches.at(-1);
    expect(last.id).toBe('fund1');
    expect(last.fields).toMatchObject({ name: 'Training Fund A Renamed' });

    // Mutations reload the portfolio afterwards, so the merged settings from
    // the mock's PATCH handler should show up in the detail view.
    await expect(page.getByRole('heading', { name: 'Training Fund A Renamed' })).toBeVisible();
  });

  test('toggles off the staleness reminder and persists it via PATCH', async ({ page }) => {
    const { posted } = await installApiMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Assets' }).click();
    await page.getByText('Training Fund A').click();

    await page.getByRole('button', { name: /edit details/i }).click();
    await page.getByRole('checkbox', { name: /remind to update/i }).uncheck();
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Asset updated')).toBeVisible();

    const last = posted.patches.at(-1);
    expect(last.id).toBe('fund1');
    expect(last.fields).toMatchObject({ staleness_reminder: false });
  });
});

test.describe('back navigation', () => {
  test('browser/PWA back returns to the previous view instead of leaving', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Assets' }).click();
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible();
    await page.getByText('Training Fund A').click();
    await expect(page.getByText(/since start/)).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('check-in', () => {
  test('bulk updates changed assets in a single /api/updates POST', async ({ page }) => {
    const { posted } = await installApiMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Check-in' }).click();

    await page.getByLabel(/new value for Training Fund A/i).fill('15000');
    await page.getByLabel(/new value for USA Real Estate Loan 1/i).fill('36000');
    await page.getByRole('button', { name: /save all/i }).click();

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(posted.updates).toHaveLength(1);
    expect(posted.updates[0]).toEqual(
      expect.arrayContaining([
        { asset_id: 'fund1', date: expect.any(String), amount: 15000 },
        { asset_id: 'usa1', date: expect.any(String), amount: 36000 },
      ])
    );
    expect(posted.updates[0]).toHaveLength(2);
  });
});

test.describe('settings', () => {
  test('logs out and returns to the login screen', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
