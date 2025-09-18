import { test, expect } from '@playwright/test';

test.describe('Photo Upload Bug Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Clear any existing photos first
    await page.evaluate(() => {
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('PhotoWalletDB');
      }
    });
    
    // Reload the page to start fresh
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should show photos immediately after upload without requiring page reload', async ({ page }) => {
    // Wait for either setup view or home view to load
    const isSetupView = await page.locator('text=No Photos Yet').isVisible();
    const isHomeView = await page.locator('text=Photo Wallet').isVisible();
    
    if (!isSetupView && !isHomeView) {
      // If neither is visible, wait a bit more
      await page.waitForTimeout(1000);
    }
    
    // Create test images using canvas
    const testImages = await page.evaluate(() => {
      const images = [];
      for (let i = 1; i <= 3; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = `hsl(${i * 120}, 70%, 50%)`;
          ctx.fillRect(0, 0, 200, 200);
          ctx.fillStyle = 'white';
          ctx.font = '20px Arial';
          ctx.fillText(`Test Image ${i}`, 50, 100);
        }
        const blob = new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        images.push(blob);
      }
      return Promise.all(images);
    });

    // Simulate file upload by creating files directly
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        // Create test files using canvas
        const files = [];
        for (let i = 1; i <= 3; i++) {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = `hsl(${i * 120}, 70%, 50%)`;
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText(`Test Image ${i}`, 50, 100);
          }
          
          // Convert canvas to blob and create file
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `test-image-${i}.png`, { type: 'image/png' });
              files.push(file);
              
              if (files.length === 3) {
                // All files created, now trigger upload
                const dt = new DataTransfer();
                files.forEach(file => dt.items.add(file));
                input.files = dt.files;
                
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
              }
            }
          }, 'image/png');
        }
      }
    });

    // Wait for photos to be processed and displayed
    await page.waitForTimeout(2000);
    
    // Check that we're on the home view (not setup)
    await expect(page.locator('text=Photo Wallet')).toBeVisible();
    
    // Check that photos are displayed immediately
    const photoGrid = page.locator('.grid.grid-cols-2');
    await expect(photoGrid).toBeVisible();
    
    // Check that we have 3 photos displayed
    const photoItems = page.locator('.grid .aspect-square');
    await expect(photoItems).toHaveCount(3);
    
    // Verify the photos are actually visible (not just empty divs)
    const firstPhoto = photoItems.first();
    await expect(firstPhoto.locator('img')).toBeVisible();
    
    // Check that the photo count is correct
    await expect(page.locator('text=Photo Wallet (3)')).toBeVisible();
  });

  test('should maintain photos when navigating between views', async ({ page }) => {
    // First upload some photos
    const testImages = await page.evaluate(() => {
      const images = [];
      for (let i = 1; i <= 2; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = `hsl(${i * 180}, 70%, 50%)`;
          ctx.fillRect(0, 0, 200, 200);
          ctx.fillStyle = 'white';
          ctx.font = '20px Arial';
          ctx.fillText(`Test ${i}`, 50, 100);
        }
        const blob = new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        images.push(blob);
      }
      return Promise.all(images);
    });

    const files = await page.evaluate((images) => {
      return images.map((blob, index) => {
        const file = new File([blob], `test-${index + 1}.png`, { type: 'image/png' });
        return file;
      });
    }, testImages);

    await page.evaluate((files) => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        input.files = dt.files;
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }, files);

    await page.waitForTimeout(2000);
    
    // Verify photos are loaded
    await expect(page.locator('text=Photo Wallet (2)')).toBeVisible();
    
    // Click on first photo to go to slide view
    const firstPhoto = page.locator('.grid .aspect-square').first();
    await firstPhoto.click();
    
    // Should be in slide view
    await expect(page.locator('text=1 / 2')).toBeVisible();
    
    // Go back to home
    await page.keyboard.press('Escape');
    
    // Should be back in home view with photos still visible
    await expect(page.locator('text=Photo Wallet (2)')).toBeVisible();
    const photoGrid = page.locator('.grid.grid-cols-2');
    await expect(photoGrid).toBeVisible();
    await expect(page.locator('.grid .aspect-square')).toHaveCount(2);
  });
});
