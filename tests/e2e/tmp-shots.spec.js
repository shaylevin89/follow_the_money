import { test } from '@playwright/test';
import { installMocks } from './mocks.js';
import { readFileSync } from 'node:fs';

const OUT = '/tmp/claude-1000/-home-shay-follow-the-money/7a856ee7-b370-44b5-9834-16010c5fca09/scratchpad';
const realData = JSON.parse(readFileSync(new URL('../../data.json', import.meta.url), 'utf-8'));

test('screenshots', async ({ page }, testInfo) => {
  await installMocks(page, { data: realData });
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/dash-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Assets' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/assets-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Check-in' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/checkin-${testInfo.project.name}.png`, fullPage: false });
});
