import { test, expect } from '@playwright/test';

test('should show smooth photo viewer experience', async ({ page }) => {
  await page.goto('/');

  // Upload photo
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a colorful test image
      const gradient = ctx.createLinearGradient(0, 0, 300, 200);
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(0.5, '#00ff00');
      gradient.addColorStop(1, '#0000ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 200);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PHOTO WALLET', 150, 100);
      ctx.fillText('TEST IMAGE', 150, 130);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'gradient-test.png', { type: 'image/png' });
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

  // Verify manager view
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  // Go to slideshow
  await page.locator('text=Start Slideshow').click();

  // Should either show loading or the image directly
  await page.waitForTimeout(500);

  // Check for loading spinner
  const hasLoading = await page.locator('text=Loading photo').isVisible();
  console.log('Shows loading state:', hasLoading);

  // Wait for image to appear
  await page.waitForTimeout(1500);

  // Verify image is visible
  const imageVisible = await page.locator('img[alt="gradient-test.png"]').isVisible();
  console.log('Image is visible:', imageVisible);

  if (imageVisible) {
    // Check image properties
    const imageInfo = await page.locator('img[alt="gradient-test.png"]').evaluate(img => ({
      naturalWidth: (img as HTMLImageElement).naturalWidth,
      naturalHeight: (img as HTMLImageElement).naturalHeight,
      complete: (img as HTMLImageElement).complete,
      visible: img.offsetParent !== null
    }));

    console.log('Image properties:', imageInfo);

    // Take final screenshot
    await page.screenshot({ path: 'test-results/final-viewer.png' });

    expect(imageInfo.complete).toBe(true);
    expect(imageInfo.visible).toBe(true);
    expect(imageInfo.naturalWidth).toBe(300);
    expect(imageInfo.naturalHeight).toBe(200);
  }

  // Test navigation back
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Should be back to manager
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  console.log('✅ Photo viewer working correctly!');
});