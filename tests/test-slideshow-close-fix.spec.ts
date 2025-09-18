import { test, expect } from '@playwright/test';

test('should close slideshow and return to manager correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Upload a photo
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST', 100, 100);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'test.png', { type: 'image/png' });
        const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;

        if (fileInput) {
          const dt = new DataTransfer();
          dt.items.add(file);
          Object.defineProperty(fileInput, 'files', {
            value: dt.files,
            configurable: true
          });
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        resolve(true);
      }, 'image/png');
    });
  });

  await page.waitForTimeout(2000);

  // Should be in manager
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();
  console.log('✅ Step 1: In manager view');

  // Start slideshow
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  // Should be in viewer
  console.log('✅ Step 2: Started slideshow');

  // Close with Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  console.log('✅ Step 3: Pressed Escape');

  // Should be back in manager, not settings
  const currentState = await page.evaluate(() => {
    const content = document.querySelector('#root')?.textContent || '';
    return {
      isManager: content.includes('Photo Wallet ('),
      isSettings: content.includes('Settings'),
      isUploader: content.includes('Add up to 10 photos'),
      hasStartSlideshow: content.includes('Start Slideshow'),
      content: content.substring(0, 200)
    };
  });

  console.log('Current state after close:', currentState);

  // Verify we're in manager
  expect(currentState.isManager).toBe(true);
  expect(currentState.isSettings).toBe(false);
  expect(currentState.hasStartSlideshow).toBe(true);

  console.log('✅ Step 4: Successfully returned to manager');

  // Test that slideshow still works after closing
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  // Verify image is still loading
  const imageStatus = await page.evaluate(() => {
    const img = document.querySelector('img[alt="test.png"]') as HTMLImageElement;
    return img ? {
      exists: true,
      complete: img.complete,
      src: img.src.substring(0, 30)
    } : { exists: false };
  });

  console.log('Image status on second slideshow:', imageStatus);
  expect(imageStatus.exists).toBe(true);

  console.log('✅ Step 5: Slideshow still works correctly after close/reopen');

  // Close again with close button
  await page.locator('button').first().click(); // Close button
  await page.waitForTimeout(500);

  // Should be back in manager again
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  console.log('✅ Step 6: Close button also works correctly');

  console.log('🎉 Slideshow close navigation fixed!');
});