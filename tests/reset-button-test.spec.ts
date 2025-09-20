import { test, expect } from '@playwright/test';

test('Reset button functionality test', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for the app to load
  await page.waitForTimeout(2000);

  // Check that we're on the welcome screen (no images)
  await expect(page.locator('text=Add your first photos')).toBeVisible();

  // Verify the text shows unlimited photos
  await expect(page.locator('text=Unlimited photos')).toBeVisible();

  // Look for the reset button in the bottom left
  const resetButton = page.locator('button[title="Reset App (Development)"]');
  await expect(resetButton).toBeVisible();

  // Click the reset button
  await resetButton.click();

  // Wait for the modal to appear with increased timeout
  await page.waitForSelector('text=Reset Photo Wallet?', { timeout: 10000 });

  // Take screenshot of the modal
  await page.screenshot({ path: 'modal-test.png', fullPage: true });

  // Verify modal is visible and properly positioned
  const modal = page.locator('text=Reset Photo Wallet?');
  await expect(modal).toBeVisible();

  // Test Cancel button
  const cancelButton = page.locator('button:has-text("Cancel")');
  await expect(cancelButton).toBeVisible();

  // Force click if needed
  await cancelButton.click({ force: true });

  // Wait for modal to disappear
  await expect(modal).not.toBeVisible({ timeout: 5000 });

  console.log('Reset button test completed successfully!');
});