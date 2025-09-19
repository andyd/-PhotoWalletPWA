import { test, expect } from '@playwright/test';

test.describe('Simple Upload Test', () => {
  test('upload images and check if they appear immediately', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/-PhotoWalletPWA/');
    await page.waitForLoadState('networkidle');
    
    // Clear any existing data
    await page.evaluate(() => {
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('PhotoWalletDB');
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-state.png', fullPage: true });
    
    // Look for "Add Photos" button or setup view
    const addPhotosBtn = page.locator('text=Add Photos').first();
    const setupView = page.locator('text=No Photos Yet');
    
    if (await setupView.isVisible()) {
      console.log('Found setup view - clicking Add Photos');
      await addPhotosBtn.click();
    } else {
      console.log('Looking for add button in home view');
      // Look for the + button in home view
      const addButton = page.locator('button[title="Add Photos"]');
      if (await addButton.isVisible()) {
        await addButton.click();
      } else {
        // Try clicking any button with a + icon
        const plusButton = page.locator('button').filter({ hasText: '+' }).first();
        await plusButton.click();
      }
    }
    
    // Create a simple test image using canvas
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Test Image', 50, 100);
      }
      
      // Convert to blob and create file
      return new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'test-image.png', { type: 'image/png' });
            
            // Find file input and set files
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) {
              const dt = new DataTransfer();
              dt.items.add(file);
              input.files = dt.files;
              
              // Trigger change event
              const event = new Event('change', { bubbles: true });
              input.dispatchEvent(event);
            }
          }
          resolve();
        }, 'image/png');
      });
    });
    
    // Wait for upload to complete
    await page.waitForTimeout(3000);
    
    // Take screenshot after upload
    await page.screenshot({ path: 'test-results/02-after-upload.png', fullPage: true });
    
    // Check what we see now
    const bodyText = await page.textContent('body');
    console.log('Body text after upload:', bodyText);
    
    // Look for photo grid
    const photoGrid = page.locator('.grid');
    const photoItems = page.locator('.aspect-square');
    
    if (await photoGrid.isVisible()) {
      console.log('Photo grid is visible');
      const count = await photoItems.count();
      console.log(`Found ${count} photo items`);
      
      if (count > 0) {
        // Check first photo
        const firstPhoto = photoItems.first();
        const img = firstPhoto.locator('img');
        
        if (await img.isVisible()) {
          const src = await img.getAttribute('src');
          console.log(`First image src: ${src}`);
          
          if (src && src.startsWith('blob:')) {
            console.log('✅ Images are loading with blob URLs');
          } else {
            console.log('❌ Images are NOT loading properly - no blob URL');
          }
        } else {
          console.log('❌ Image element not visible');
        }
      }
    } else {
      console.log('❌ Photo grid not visible');
    }
    
    // Check if we see file names instead of images
    const fileNames = await page.locator('text=test-image.png').count();
    if (fileNames > 0) {
      console.log('❌ BUG CONFIRMED: File names are showing instead of images!');
    }
    
    // Check header text
    const headers = page.locator('h1, h2, h3');
    for (let i = 0; i < await headers.count(); i++) {
      const text = await headers.nth(i).textContent();
      console.log(`Header ${i}: ${text}`);
    }
  });
});
