import { test, expect } from '@playwright/test';

test('should handle photo upload flow', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Should start on uploader view
  await expect(page.locator('text=Add up to 10 photos to your wallet')).toBeVisible();

  // Create a test file and trigger upload
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

    // Convert to blob and file
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        // Create File
        const file = new File([blob], 'test-image.png', { type: 'image/png' });

        // Get the uploader component and trigger file upload
        const app = (window as any).React;

        // Find the file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          // Create a DataTransfer object
          const dt = new DataTransfer();
          dt.items.add(file);

          // Set the files property
          Object.defineProperty(fileInput, 'files', {
            value: dt.files,
            writable: false,
          });

          // Trigger change event
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }

        resolve(true);
      }, 'image/png');
    });
  });

  // Wait for upload processing
  await page.waitForTimeout(2000);

  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/after-upload-simple.png' });

  // Check if we see any photos or moved to manager view
  const bodyText = await page.textContent('body');
  console.log('Page contains "Photo Wallet (":', bodyText?.includes('Photo Wallet ('));
  console.log('Page contains "Start Slideshow":', bodyText?.includes('Start Slideshow'));
  console.log('Page contains "Add Photos":', bodyText?.includes('Add Photos'));

  // Check for any error messages
  const hasErrors = await page.locator('.bg-red-500').isVisible();
  console.log('Has error messages:', hasErrors);

  if (hasErrors) {
    const errorText = await page.locator('.bg-red-500').textContent();
    console.log('Error message:', errorText);
  }

  // Look for photo grid or manager elements
  const hasGrid = await page.locator('.grid').isVisible();
  const hasPhotoManager = await page.locator('text=Photo Wallet (').isVisible();

  console.log('Has grid:', hasGrid);
  console.log('Has photo manager:', hasPhotoManager);
});