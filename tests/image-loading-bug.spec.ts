import { test, expect } from '@playwright/test';

test.describe('Image Loading Bug Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/-PhotoWalletPWA/');
    
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

  test('should show images immediately after upload without page reload', async ({ page }) => {
    // Wait for the app to be ready
    await page.waitForTimeout(1000);
    
    // Check if we're in setup view or home view
    const setupView = page.locator('text=No Photos Yet');
    const homeView = page.locator('text=Photo Wallet');
    
    console.log('Checking initial app state...');
    
    // If we're in setup view, we should see "Add Photos" button
    if (await setupView.isVisible()) {
      console.log('App is in setup view - no photos yet');
      await expect(setupView).toBeVisible();
    } else if (await homeView.isVisible()) {
      console.log('App is in home view - has photos already');
      // Clear existing photos first
      await page.click('button[title="Settings"]');
      await page.click('text=Clear All Photos');
      await page.waitForTimeout(1000);
    }
    
    // Create test images using canvas
    console.log('Creating test images...');
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
        
        // Convert to blob
        return new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
      }
      return Promise.all(images);
    });

    // Convert blobs to files and upload
    console.log('Uploading test images...');
    await page.evaluate((images) => {
      const files = images.map((blob, index) => {
        return new File([blob], `test-image-${index + 1}.png`, { type: 'image/png' });
      });
      
      // Find the file input
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        // Create a new FileList-like object
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        input.files = dt.files;
        
        // Trigger the change event
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }, testImages);

    // Wait for photos to be processed
    console.log('Waiting for photos to be processed...');
    await page.waitForTimeout(3000);
    
    // Check what we see after upload
    console.log('Checking post-upload state...');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/post-upload-state.png', fullPage: true });
    
    // Check if we're on the home view
    const homeViewAfter = page.locator('text=Photo Wallet');
    await expect(homeViewAfter).toBeVisible();
    
    // Check if photos are displayed (this is where the bug likely is)
    const photoGrid = page.locator('.grid.grid-cols-2');
    const photoItems = page.locator('.grid .aspect-square');
    
    console.log('Checking photo grid...');
    if (await photoGrid.isVisible()) {
      console.log('Photo grid is visible');
      const photoCount = await photoItems.count();
      console.log(`Found ${photoCount} photo items`);
      
      if (photoCount > 0) {
        // Check if images are actually loaded or just showing placeholders
        const firstPhoto = photoItems.first();
        const imgElement = firstPhoto.locator('img');
        
        if (await imgElement.isVisible()) {
          console.log('Image element is visible');
          
          // Check if the image has a valid src
          const src = await imgElement.getAttribute('src');
          console.log(`Image src: ${src}`);
          
          if (src && src.startsWith('blob:')) {
            console.log('✅ Images are loading correctly with blob URLs');
          } else {
            console.log('❌ Images are not loading correctly - no blob URL');
          }
        } else {
          console.log('❌ Image element is not visible');
        }
      } else {
        console.log('❌ No photo items found in grid');
      }
    } else {
      console.log('❌ Photo grid is not visible');
    }
    
    // Check the photo count in the header
    const headerText = await page.locator('h2').textContent();
    console.log(`Header text: ${headerText}`);
    
    // Verify we have the expected number of photos
    await expect(page.locator('text=Photo Wallet (3)')).toBeVisible();
    
    // Verify photos are actually displayed with images
    const photoItemsFinal = page.locator('.grid .aspect-square');
    await expect(photoItemsFinal).toHaveCount(3);
    
    // Check that images are loaded (not just placeholders)
    const firstPhoto = photoItemsFinal.first();
    const imgElement = firstPhoto.locator('img');
    await expect(imgElement).toBeVisible();
    
    // Verify the image has a blob URL
    const src = await imgElement.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('should show images after page reload if they were uploaded', async ({ page }) => {
    // First upload some photos (same as above)
    await page.waitForTimeout(1000);
    
    // Create and upload test images
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
        
        return new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
      }
      return Promise.all(images);
    });

    await page.evaluate((images) => {
      const files = images.map((blob, index) => {
        return new File([blob], `test-${index + 1}.png`, { type: 'image/png' });
      });
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        input.files = dt.files;
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }, testImages);

    await page.waitForTimeout(3000);
    
    // Now reload the page
    console.log('Reloading page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if photos are still there after reload
    await expect(page.locator('text=Photo Wallet (2)')).toBeVisible();
    
    const photoItems = page.locator('.grid .aspect-square');
    await expect(photoItems).toHaveCount(2);
    
    // Check that images are loaded after reload
    const firstPhoto = photoItems.first();
    const imgElement = firstPhoto.locator('img');
    await expect(imgElement).toBeVisible();
    
    const src = await imgElement.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });
});
