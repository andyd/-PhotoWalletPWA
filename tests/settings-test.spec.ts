import { test, expect } from '@playwright/test';

test('should open settings via double-tap and manage photos', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Upload a few photos first
  for (let i = 0; i < 3; i++) {
    await page.evaluate(async (index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create different colored test images
        const colors = ['red', 'green', 'blue'];
        ctx.fillStyle = colors[index];
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Photo ${index + 1}`, 100, 100);
      }

      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return resolve(false);

          const file = new File([blob], `test-photo-${index + 1}.png`, { type: 'image/png' });
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
    }, i);

    await page.waitForTimeout(1000);
  }

  // Should be in manager view now
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  // Test double-tap to open settings
  await page.locator('body').dblclick();
  await page.waitForTimeout(500);

  // Should now be in settings
  await expect(page.locator('text=Settings')).toBeVisible();
  await expect(page.locator('text=3 of 10 photos')).toBeVisible();

  // Take screenshot of settings
  await page.screenshot({ path: 'test-results/settings-view.png' });

  // Test selecting photos
  const firstPhoto = page.locator('[alt="test-photo-1.png"]').first();
  await firstPhoto.click();
  await page.waitForTimeout(200);

  // Should show selection
  const selectedPhotos = await page.locator('.ring-2.ring-blue-500').count();
  console.log('Selected photos:', selectedPhotos);
  expect(selectedPhotos).toBe(1);

  // Test Select All
  await page.locator('text=Select All').click();
  await page.waitForTimeout(200);

  const allSelected = await page.locator('.ring-2.ring-blue-500').count();
  console.log('All selected photos:', allSelected);
  expect(allSelected).toBe(3);

  // Test Deselect All
  await page.locator('text=Deselect All').click();
  await page.waitForTimeout(200);

  const noneSelected = await page.locator('.ring-2.ring-blue-500').count();
  console.log('None selected photos:', noneSelected);
  expect(noneSelected).toBe(0);

  // Test adding photos via settings
  await page.locator('text=Add Photos').click();

  // Upload another photo via settings
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Photo 4', 100, 100);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'test-photo-4.png', { type: 'image/png' });
        const fileInput = document.querySelector('[data-testid="settings-file-input"]') as HTMLInputElement;

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

  // Should now show 4 photos
  await expect(page.locator('text=4 of 10 photos')).toBeVisible();

  // Close settings
  await page.locator('svg').first().click(); // Close button
  await page.waitForTimeout(500);

  // Should be back to manager
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  console.log('✅ Settings functionality working correctly!');
});

test('should open settings via lower screen tap', async ({ page }) => {
  await page.goto('/');

  // Upload one photo to get to manager
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'purple';
      ctx.fillRect(0, 0, 100, 100);
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

  // Click in lower 10% of screen
  const viewportSize = await page.viewportSize();
  if (viewportSize) {
    const lowerScreenY = viewportSize.height * 0.95; // 95% down the screen
    await page.click('body', { position: { x: viewportSize.width / 2, y: lowerScreenY } });
    await page.waitForTimeout(500);

    // Should open settings
    await expect(page.locator('text=Settings')).toBeVisible();

    console.log('✅ Lower screen tap opens settings!');
  }
});