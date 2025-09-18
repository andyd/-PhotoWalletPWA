import { test, expect } from '@playwright/test';

test('should access settings and show photo management interface', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Upload one photo to get to manager
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

  // Should be in manager view
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  // Test double-tap anywhere on the page to open settings
  const bodyRect = await page.locator('body').boundingBox();
  if (bodyRect) {
    const centerX = bodyRect.x + bodyRect.width / 2;
    const centerY = bodyRect.y + bodyRect.height / 2;

    // Perform double-tap
    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(100);
    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(500);
  }

  // Should now be in settings
  await expect(page.locator('text=Settings')).toBeVisible();

  // Check for photo count (should be "1 of 10 photos")
  const photoCountText = await page.textContent('body');
  console.log('Settings page content includes:');
  console.log('- "1 of 10 photos":', photoCountText?.includes('1 of 10 photos'));
  console.log('- "Settings":', photoCountText?.includes('Settings'));
  console.log('- "Add Photos":', photoCountText?.includes('Add Photos'));

  // Take screenshot
  await page.screenshot({ path: 'test-results/settings-simple.png' });

  // Test close button
  await page.locator('button').first().click(); // Close button (X)
  await page.waitForTimeout(500);

  // Should be back to manager
  await expect(page.locator('text=Photo Wallet (')).toBeVisible();

  console.log('✅ Settings access and basic functionality working!');
});

test('should access settings via lower screen tap', async ({ page }) => {
  await page.goto('/');

  // Upload photo to get to manager
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
    const lowerScreenY = viewportSize.height * 0.95;
    await page.mouse.click(viewportSize.width / 2, lowerScreenY);
    await page.waitForTimeout(500);

    // Should open settings
    await expect(page.locator('text=Settings')).toBeVisible();

    console.log('✅ Lower screen tap opens settings correctly!');
  }
});