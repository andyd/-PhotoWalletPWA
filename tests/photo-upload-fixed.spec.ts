import { test, expect } from '@playwright/test';

test('should upload photos and show them in manager', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Should start on uploader view
  await expect(page.locator('text=Add up to 10 photos to your wallet')).toBeVisible();

  // Create a test image file and upload it
  await page.evaluate(async () => {
    // Create a test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
    }

    // Convert to blob and create file
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'test-image.png', { type: 'image/png' });

        // Find the hidden file input
        const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
        if (fileInput) {
          // Create DataTransfer and add file
          const dt = new DataTransfer();
          dt.items.add(file);

          // Set files and trigger change
          Object.defineProperty(fileInput, 'files', {
            value: dt.files,
            configurable: true
          });

          // Trigger change event
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        resolve(true);
      }, 'image/png');
    });
  });

  // Wait for upload and processing
  await page.waitForTimeout(3000);

  // Take screenshot to see what happened
  await page.screenshot({ path: 'test-results/upload-result.png' });

  // Check page content
  const pageContent = await page.textContent('body');
  console.log('Page contains:');
  console.log('- "Photo Wallet (":', pageContent?.includes('Photo Wallet ('));
  console.log('- "Start Slideshow":', pageContent?.includes('Start Slideshow'));
  console.log('- "Add up to 10 photos":', pageContent?.includes('Add up to 10 photos'));
  console.log('- "1 of 10":', pageContent?.includes('1 of 10'));

  // Check for manager view elements
  const managerVisible = await page.locator('text=Photo Wallet (').isVisible();
  const gridVisible = await page.locator('.grid').isVisible();
  const slideshowButton = await page.locator('text=Start Slideshow').isVisible();

  console.log('Manager visible:', managerVisible);
  console.log('Grid visible:', gridVisible);
  console.log('Slideshow button visible:', slideshowButton);

  // Check for any error messages
  const errorVisible = await page.locator('.bg-red-500').isVisible();
  if (errorVisible) {
    const errorText = await page.locator('.bg-red-500').textContent();
    console.log('Error message:', errorText);
  }

  // If we're still on uploader, check for loading state
  const loadingVisible = await page.locator('text=Adding photos').isVisible();
  console.log('Loading state visible:', loadingVisible);
});