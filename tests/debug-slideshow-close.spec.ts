import { test, expect } from '@playwright/test';

test('should debug slideshow close navigation issue', async ({ page }) => {
  // Capture console logs and errors
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', (error) => {
    errors.push(`Error: ${error.message}`);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Upload a photo to get to manager
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'green';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST PHOTO', 100, 100);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'test-photo.png', { type: 'image/png' });
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

  // Should be in manager view
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();
  console.log('✅ Step 1: In manager view');

  // Take screenshot of manager
  await page.screenshot({ path: 'test-results/debug-manager.png' });

  // Start slideshow
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  // Should be in viewer now
  console.log('✅ Step 2: Started slideshow');

  // Take screenshot of viewer
  await page.screenshot({ path: 'test-results/debug-viewer.png' });

  // Check what's in the viewer
  const viewerContent = await page.evaluate(() => {
    return {
      hasImage: document.querySelectorAll('img').length > 0,
      imagesSrc: Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src.substring(0, 50),
        alt: img.alt,
        complete: (img as HTMLImageElement).complete
      })),
      bodyClasses: document.body.className,
      rootContent: document.querySelector('#root')?.textContent?.substring(0, 200)
    };
  });

  console.log('Viewer content:', JSON.stringify(viewerContent, null, 2));

  // Close slideshow using Escape key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  console.log('✅ Step 3: Pressed Escape to close slideshow');

  // Take screenshot of result
  await page.screenshot({ path: 'test-results/debug-after-close.png' });

  // Check what page we're on now
  const afterCloseContent = await page.evaluate(() => {
    return {
      currentView: document.querySelector('#root')?.textContent?.includes('Photo Wallet (') ? 'manager' :
                   document.querySelector('#root')?.textContent?.includes('Settings') ? 'settings' :
                   document.querySelector('#root')?.textContent?.includes('Add up to 10 photos') ? 'uploader' :
                   'unknown',
      hasErrors: document.querySelector('#root')?.textContent?.includes('error') ||
                document.querySelector('#root')?.textContent?.includes('Error'),
      pageText: document.querySelector('#root')?.textContent?.substring(0, 300),
      imageCount: document.querySelectorAll('img').length,
      hasPhotoWalletText: document.querySelector('#root')?.textContent?.includes('Photo Wallet'),
      hasStartSlideshowButton: document.querySelector('#root')?.textContent?.includes('Start Slideshow')
    };
  });

  console.log('After close analysis:', JSON.stringify(afterCloseContent, null, 2));

  // Log any errors
  console.log('Console logs:', logs.slice(-10));
  console.log('Page errors:', errors);

  // Check if we can navigate properly
  if (afterCloseContent.currentView === 'manager') {
    console.log('✅ Successfully returned to manager');
  } else if (afterCloseContent.currentView === 'uploader') {
    console.log('⚠️ Returned to uploader instead of manager');
  } else {
    console.log('❌ Ended up in unknown state:', afterCloseContent.currentView);
  }

  // Try to go back to slideshow to test if images are still working
  if (afterCloseContent.hasStartSlideshowButton) {
    await page.locator('text=Start Slideshow').click();
    await page.waitForTimeout(1000);

    const secondViewerTest = await page.evaluate(() => {
      const img = document.querySelector('img[alt="test-photo.png"]') as HTMLImageElement;
      return img ? {
        exists: true,
        complete: img.complete,
        src: img.src.substring(0, 50),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      } : { exists: false };
    });

    console.log('Second viewer test:', secondViewerTest);

    await page.screenshot({ path: 'test-results/debug-second-viewer.png' });
  }
});