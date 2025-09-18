import { test, expect } from '@playwright/test';

test.describe('Simple Photo Upload Test', () => {
  test('should show photos immediately after upload', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Clear any existing photos first
    await page.evaluate(() => {
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('PhotoWalletDB');
      }
    });
    
    // Reload the page to start fresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for the app to be ready
    await page.waitForTimeout(1000);
    
    // Check if we're in setup view or home view
    const setupView = page.locator('text=No Photos Yet');
    const homeView = page.locator('text=Photo Wallet');
    
    // If we're in setup view, click the "Add Photos" button
    if (await setupView.isVisible()) {
      await page.click('text=Add Photos');
    } else if (await homeView.isVisible()) {
      // If we're in home view, click the add button
      await page.click('button[title="Add Photos"]');
    }
    
    // Use the test images from the assets folder
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      'tests/assets/test-image-1.jpg',
      'tests/assets/test-image-2.jpg',
      'tests/assets/test-image-3.jpg'
    ]);
    
    // Wait for photos to be processed
    await page.waitForTimeout(3000);
    
    // Check that we're on the home view
    await expect(page.locator('text=Photo Wallet (3)')).toBeVisible();
    
    // Check that photos are displayed
    const photoGrid = page.locator('.grid.grid-cols-2');
    await expect(photoGrid).toBeVisible();
    
    // Check that we have 3 photos displayed
    const photoItems = page.locator('.grid .aspect-square');
    await expect(photoItems).toHaveCount(3);
    
    // Verify the photos are actually visible
    const firstPhoto = photoItems.first();
    await expect(firstPhoto.locator('img')).toBeVisible();
  });
});
