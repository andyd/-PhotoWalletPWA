import { test, expect } from '@playwright/test';

test('verify slideshow navigation fix works', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check if app loads
  await expect(page.locator('text=Add up to 10 photos')).toBeVisible();
  console.log('✅ App loaded successfully');

  // Upload a simple photo using file upload
  const fileInput = page.locator('[data-testid="file-input"]');

  // Create a test image file
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  await fileInput.setInputFiles({
    name: 'test-image.png',
    mimeType: 'image/png',
    buffer: buffer
  });

  await page.waitForTimeout(2000);

  // Should be in manager view now
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();
  console.log('✅ Photo uploaded, now in manager view');

  // Click Start Slideshow
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  // Should be in viewer now (look for close button and full-screen image)
  await expect(page.locator('button').first()).toBeVisible(); // Close button
  console.log('✅ Slideshow started');

  // Press Escape to close slideshow
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500); // Wait for the temporarilyDisable timeout

  // Should be back in manager view (NOT settings)
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();
  await expect(page.locator('text=Start Slideshow')).toBeVisible();

  // Should NOT be in settings
  await expect(page.locator('text=Settings')).not.toBeVisible();

  console.log('✅ Slideshow closed correctly - back to manager view (not settings)');

  // Now test that settings still work via double-tap
  await page.locator('body').dblclick();
  await page.waitForTimeout(500);

  await expect(page.locator('text=Settings')).toBeVisible();
  console.log('✅ Settings still accessible via double-tap');

  console.log('🎉 Navigation fix verified successfully!');
});