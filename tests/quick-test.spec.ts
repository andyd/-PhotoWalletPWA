import { test, expect } from '@playwright/test';

test('should load without infinite re-render errors', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().includes('Maximum update depth')) {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');
  await page.waitForTimeout(3000);

  console.log('Console errors with "Maximum update depth":', consoleErrors.length);

  // Should not have infinite re-render errors
  expect(consoleErrors.length).toBe(0);

  // Should show the uploader
  await expect(page.locator('text=Photo Wallet')).toBeVisible();
  await expect(page.locator('text=Add Photos')).toBeVisible();
});