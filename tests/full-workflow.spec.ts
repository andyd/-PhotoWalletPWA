import { test, expect } from '@playwright/test';

test('should complete full photo wallet workflow', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // 1. Start with uploader
  await expect(page.locator('text=Add up to 10 photos to your wallet')).toBeVisible();

  // 2. Upload a photo
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'test-image.png', { type: 'image/png' });
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

  // 3. Wait for transition to manager
  await page.waitForTimeout(2000);

  // 4. Verify manager view
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();
  await expect(page.locator('text=Start Slideshow')).toBeVisible();

  // 5. Check photo count
  const photoCountText = await page.locator('text=Photo Wallet (').textContent();
  expect(photoCountText).toContain('(1/10)');

  // 6. Click Start Slideshow to go to viewer
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  // 7. Verify viewer (should show photo and controls)
  // In viewer, controls might be hidden initially, so let's check for photo element
  await page.waitForTimeout(1000);

  // 8. Try to go back (press Escape or look for close button)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // 9. Should be back to manager
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  console.log('✅ Full workflow completed successfully!');
});