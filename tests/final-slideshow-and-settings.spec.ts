import { test, expect } from '@playwright/test';

test('should handle both slideshow close and settings access correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Upload a photo
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'orange';
      ctx.fillRect(0, 0, 150, 150);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FINAL TEST', 75, 75);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'final-test.png', { type: 'image/png' });
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

  // Test 1: Settings access from manager via double-tap
  await page.locator('body').dblclick();
  await page.waitForTimeout(500);

  await expect(page.locator('text=Settings')).toBeVisible();
  console.log('✅ Step 2: Settings opened from manager via double-tap');

  // Close settings
  await page.locator('button').first().click();
  await page.waitForTimeout(500);

  await expect(page.locator('text=Photo Wallet (')).toBeVisible();
  console.log('✅ Step 3: Closed settings, back to manager');

  // Test 2: Settings access from manager via lower screen tap
  const viewportSize = await page.viewportSize();
  if (viewportSize) {
    const lowerScreenY = viewportSize.height * 0.95;
    await page.mouse.click(viewportSize.width / 2, lowerScreenY);
    await page.waitForTimeout(500);

    await expect(page.locator('text=Settings')).toBeVisible();
    console.log('✅ Step 4: Settings opened from manager via lower screen tap');

    // Close settings again
    await page.locator('button').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=Photo Wallet (')).toBeVisible();
    console.log('✅ Step 5: Closed settings again, back to manager');
  }

  // Test 3: Slideshow close should go to manager, not settings
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  console.log('✅ Step 6: Started slideshow');

  // Close with Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Should be back in manager, NOT settings
  const currentState = await page.evaluate(() => {
    const content = document.querySelector('#root')?.textContent || '';
    return {
      isManager: content.includes('Photo Wallet ('),
      isSettings: content.includes('Settings'),
      hasStartSlideshow: content.includes('Start Slideshow')
    };
  });

  expect(currentState.isManager).toBe(true);
  expect(currentState.isSettings).toBe(false);
  expect(currentState.hasStartSlideshow).toBe(true);

  console.log('✅ Step 7: Slideshow closed correctly to manager');

  // Test 4: Verify slideshow still works after close
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  const imageStatus = await page.evaluate(() => {
    const img = document.querySelector('img[alt="final-test.png"]') as HTMLImageElement;
    return img ? {
      exists: true,
      complete: img.complete
    } : { exists: false };
  });

  expect(imageStatus.exists).toBe(true);
  expect(imageStatus.complete).toBe(true);

  console.log('✅ Step 8: Slideshow still works correctly');

  // Close with close button
  await page.locator('button').first().click();
  await page.waitForTimeout(500);

  await expect(page.locator('text=Photo Wallet (')).toBeVisible();
  console.log('✅ Step 9: Close button also works correctly');

  console.log('🎉 Both slideshow navigation and settings access work perfectly!');
});