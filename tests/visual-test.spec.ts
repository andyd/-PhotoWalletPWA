import { test } from '@playwright/test';

test('should show visual experience of photo viewer', async ({ page }) => {
  await page.goto('/');

  // Upload photo
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a more visible test image
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.fillText('TEST', 70, 110);
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

  await page.waitForTimeout(2000);

  // Take screenshot of manager
  await page.screenshot({ path: 'test-results/visual-manager.png', fullPage: true });

  // Go to slideshow
  await page.locator('text=Start Slideshow').click();

  // Wait a moment for viewer to load
  await page.waitForTimeout(1000);

  // Take multiple screenshots to see the progression
  await page.screenshot({ path: 'test-results/visual-viewer-1.png', fullPage: true });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/visual-viewer-2.png', fullPage: true });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/visual-viewer-3.png', fullPage: true });

  // Check actual image dimensions
  const imageInfo = await page.evaluate(() => {
    const img = document.querySelector('img[alt="test-image.png"]') as HTMLImageElement;
    if (img) {
      return {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.offsetWidth,
        displayHeight: img.offsetHeight,
        complete: img.complete,
        src: img.src.substring(0, 50),
        parentClasses: img.parentElement?.className,
        computedStyle: {
          display: getComputedStyle(img).display,
          visibility: getComputedStyle(img).visibility,
          opacity: getComputedStyle(img).opacity
        }
      };
    }
    return null;
  });

  console.log('Image info:', imageInfo);
});