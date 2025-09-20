import { test, expect } from '@playwright/test';

test('Test reset button functionality', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for the app to load
  await page.waitForTimeout(2000);

  // Take a screenshot to see the current state
  await page.screenshot({ path: 'before-reset.png', fullPage: true });

  // Look for the reset button in the lower left corner
  const resetButton = page.locator('button[title="Reset App (Development)"]');

  // Check if reset button is present but initially semi-transparent
  await expect(resetButton).toBeVisible();

  // Hover over the reset button to make it fully visible
  await resetButton.hover();

  // Click the reset button
  await resetButton.click();

  // Wait for the confirmation modal
  await page.waitForSelector('text=Reset Photo Wallet?');

  // Take a screenshot of the modal
  await page.screenshot({ path: 'reset-modal.png', fullPage: true });

  // Verify modal content
  await expect(page.locator('text=Reset Photo Wallet?')).toBeVisible();
  await expect(page.locator('text=This will permanently delete all photos')).toBeVisible();

  // Test cancel first
  await page.click('button:has-text("Cancel")');

  // Modal should disappear
  await expect(page.locator('text=Reset Photo Wallet?')).not.toBeVisible();

  // Click reset button again
  await resetButton.click();

  // Wait for modal again
  await page.waitForSelector('text=Reset Photo Wallet?');

  // This time click Reset App - this will reload the page
  await page.click('button:has-text("Reset App")');

  // Wait for page reload
  await page.waitForLoadState('networkidle');

  // Take final screenshot
  await page.screenshot({ path: 'after-reset.png', fullPage: true });

  // Verify we're back to the welcome screen
  await expect(page.locator('text=Photo Wallet')).toBeVisible();
  await expect(page.locator('text=Add your first photos')).toBeVisible();

  console.log('Reset functionality test completed successfully');
});