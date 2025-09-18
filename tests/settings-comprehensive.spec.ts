import { test, expect } from '@playwright/test';

test('should demonstrate complete settings functionality', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Upload 2 photos to start
  for (let i = 1; i <= 2; i++) {
    await page.evaluate(async (index) => {
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const colors = ['#ff4444', '#44ff44'];
        ctx.fillStyle = colors[index - 1];
        ctx.fillRect(0, 0, 150, 150);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Photo ${index}`, 75, 75);
      }

      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return resolve(false);

          const file = new File([blob], `photo-${index}.png`, { type: 'image/png' });
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

  // Should be in manager view
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  console.log('✅ Step 1: Uploaded 2 photos to manager');

  // Open settings via double-tap
  await page.locator('body').dblclick();
  await page.waitForTimeout(500);

  // Verify settings opened
  await expect(page.locator('text=Settings')).toBeVisible();
  await expect(page.locator('text=2 of 10 photos')).toBeVisible();

  console.log('✅ Step 2: Opened settings via double-tap');

  // Test adding a photo via settings
  await page.locator('text=Add Photos').click();

  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4444ff';
      ctx.fillRect(0, 0, 150, 150);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Photo 3', 75, 75);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'photo-3.png', { type: 'image/png' });
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

  // Verify photo was added
  await expect(page.locator('text=3 of 10 photos')).toBeVisible();

  console.log('✅ Step 3: Added photo via settings');

  // Test photo selection
  const firstPhoto = page.locator('[alt="photo-1.png"]').first();
  await firstPhoto.click();
  await page.waitForTimeout(200);

  // Verify selection
  const selectedCount = await page.locator('.ring-2.ring-blue-500').count();
  expect(selectedCount).toBe(1);

  console.log('✅ Step 4: Selected photo successfully');

  // Test Select All
  await page.locator('text=Select All').click();
  await page.waitForTimeout(200);

  const allSelectedCount = await page.locator('.ring-2.ring-blue-500').count();
  expect(allSelectedCount).toBe(3);

  console.log('✅ Step 5: Selected all photos');

  // Test Delete Selected (but cancel it)
  await page.locator('text=Delete Selected (3)').click();
  await page.waitForTimeout(200);

  // Deselect to avoid deleting
  await page.locator('text=Deselect All').click();
  await page.waitForTimeout(200);

  // Should still have 3 photos
  await expect(page.locator('text=3 of 10 photos')).toBeVisible();

  console.log('✅ Step 6: Tested selection and deselection');

  // Take final screenshot of settings
  await page.screenshot({ path: 'test-results/settings-complete.png' });

  // Close settings by clicking close button
  const closeButton = page.locator('button').first();
  await closeButton.click();
  await page.waitForTimeout(500);

  // Should be back to manager with 3 photos
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  // Count photos in manager view
  const photosInManager = await page.locator('img[alt*="photo-"]').count();
  expect(photosInManager).toBe(3);

  console.log('✅ Step 7: Closed settings and returned to manager with 3 photos');

  // Test settings access from different view (viewer)
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  // Should be in viewer now - test lower screen tap
  const viewportSize = await page.viewportSize();
  if (viewportSize) {
    const lowerScreenY = viewportSize.height * 0.95;
    await page.mouse.click(viewportSize.width / 2, lowerScreenY);
    await page.waitForTimeout(500);

    // Should open settings from viewer
    await expect(page.locator('text=Settings')).toBeVisible();

    console.log('✅ Step 8: Opened settings from viewer via lower screen tap');

    // Close and should return to manager (not viewer)
    await page.locator('button').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=Photo Wallet (')).toBeVisible();

    console.log('✅ Step 9: Settings properly returns to manager from viewer');
  }

  console.log('🎉 All settings functionality working perfectly!');
});