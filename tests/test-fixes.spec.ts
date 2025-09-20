import { test, expect } from '@playwright/test';

test('Test all fixes - clean state, reset button, no limit', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for the app to load
  await page.waitForTimeout(2000);

  // Take a screenshot to see current state
  await page.screenshot({ path: 'current-state.png', fullPage: true });

  // Check that we're on the welcome screen (no images)
  await expect(page.locator('text=Add your first photos')).toBeVisible();

  // Verify the text shows unlimited photos
  await expect(page.locator('text=Unlimited photos')).toBeVisible();

  // Verify the text doesn't mention "up to 10"
  await expect(page.locator('text=up to 10')).not.toBeVisible();

  // Look for the reset button
  const resetButton = page.locator('button[title="Reset App (Development)"]');
  await expect(resetButton).toBeVisible();

  // Test the reset button click
  await resetButton.click();

  // Wait for the modal
  await page.waitForSelector('text=Reset Photo Wallet?', { timeout: 5000 });

  // Take screenshot of modal
  await page.screenshot({ path: 'reset-modal-working.png', fullPage: true });

  // Verify modal content
  await expect(page.locator('text=Reset Photo Wallet?')).toBeVisible();

  // Cancel the reset
  await page.click('button:has-text("Cancel")');

  // Modal should disappear
  await expect(page.locator('text=Reset Photo Wallet?')).not.toBeVisible();

  console.log('All fixes working correctly!');
});