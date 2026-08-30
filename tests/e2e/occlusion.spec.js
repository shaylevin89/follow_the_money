import { test, expect } from '@playwright/test';
import { installMocks, e2eData } from './mocks.js';

// Regression: rows scrolled to the viewport bottom must not end up behind the
// fixed bottom nav / check-in footer (tap would hit the bar → "nothing happens").
// scroll-padding-bottom keeps scrolled-to elements clear of the fixed bars.

function manyAssets() {
  const data = e2eData();
  for (let n = 0; n < 18; n++) {
    data.investments.push({ ...data.investments[1], id: `f${n}`, name: `Filler ${n}` });
  }
  return data;
}

async function hitsItself(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit === el || el.contains(hit);
  });
}

test('check-in input scrolled to viewport bottom stays tappable', async ({ page }) => {
  await installMocks(page, { data: manyAssets() });
  await page.goto('/');
  await page.getByRole('button', { name: 'Check-in' }).click();

  const input = page.getByLabel(/new value for Filler 9/i);
  await input.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(250);
  expect(await hitsItself(input)).toBe(true);

  await input.fill('123');
  await expect(input).toHaveValue('123');
});

test('asset card scrolled to viewport bottom stays tappable', async ({ page }) => {
  await installMocks(page, { data: manyAssets() });
  await page.goto('/');
  await page.getByRole('button', { name: 'Assets' }).click();

  const card = page.getByRole('button', { name: /Filler 9/ });
  await card.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(250);
  expect(await hitsItself(card)).toBe(true);
});
