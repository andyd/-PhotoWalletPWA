import { test, expect } from '@playwright/test';

test('should debug photo viewer display issues', async ({ page }) => {
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

  // Upload a photo
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
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

  await page.waitForTimeout(2000);

  // Verify we're in manager
  await expect(page.locator('text=Start Slideshow')).toBeVisible();

  // Take screenshot of manager
  await page.screenshot({ path: 'test-results/manager-with-photo.png' });

  // Click Start Slideshow
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  // Take screenshot of viewer
  await page.screenshot({ path: 'test-results/viewer-empty.png' });

  // Check what's in the DOM
  const viewerContent = await page.evaluate(() => {
    const body = document.body;

    // Look for PhotoViewer component
    const viewer = document.querySelector('[class*="fixed inset-0"]');
    if (viewer) {
      return {
        viewerExists: true,
        viewerHTML: viewer.innerHTML.substring(0, 500),
        imageElements: document.querySelectorAll('img').length,
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src.substring(0, 100),
          alt: img.alt,
          visible: img.offsetParent !== null
        }))
      };
    }

    return {
      viewerExists: false,
      bodyClasses: body.className,
      bodyContent: body.textContent?.substring(0, 200)
    };
  });

  console.log('Viewer content analysis:', JSON.stringify(viewerContent, null, 2));

  // Check for blob URLs and photo data
  const photoData = await page.evaluate(() => {
    // Try to access photo data from React state
    const reactFiber = (document.querySelector('#root') as any)?._reactInternalFiber;

    return {
      hasReactFiber: !!reactFiber,
      urlsInPage: Array.from(document.querySelectorAll('*')).map(el =>
        (el as HTMLElement).style.backgroundImage || ''
      ).filter(bg => bg.includes('blob:')),
      blobURLs: Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src.includes('blob:'))
    };
  });

  console.log('Photo data analysis:', JSON.stringify(photoData, null, 2));

  // Log any errors
  console.log('Console logs:', logs.slice(-10)); // Last 10 logs
  console.log('Page errors:', errors);

  // Check if we can access IndexedDB data
  const dbData = await page.evaluate(async () => {
    try {
      const request = indexedDB.open('PhotoWalletDB', 1);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['photos'], 'readonly');
          const store = transaction.objectStore('photos');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            const photos = getAllRequest.result;
            resolve({
              success: true,
              photoCount: photos.length,
              photos: photos.map(p => ({
                id: p.id,
                originalName: p.originalName,
                blobSize: p.blob ? p.blob.size : 'no blob',
                order: p.order
              }))
            });
          };
        };

        request.onerror = () => resolve({ error: 'DB access failed' });
      });
    } catch (error) {
      return { error: error.message };
    }
  });

  console.log('IndexedDB data:', JSON.stringify(dbData, null, 2));
});