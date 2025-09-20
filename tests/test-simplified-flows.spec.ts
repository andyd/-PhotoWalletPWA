import { test, expect } from '@playwright/test';

test.describe('Simplified PhotoWalletPWA Flows', () => {
  test('Complete app flow test', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Welcome Screen
    console.log('✅ Testing Welcome Screen...');
    await expect(page.locator('h1')).toContainText('PHOTO WALLET');
    await expect(page.locator('button')).toContainText('Add Photos');
    
    // Test 2: Navigate to Photos Screen (empty state)
    console.log('✅ Testing Empty Photos Screen...');
    
    // Use browser console to navigate to photos view
    await page.evaluate(() => {
      // Access the UI store directly
      const stores = (window as any).__ZUSTAND_STORES__;
      if (stores && stores.uiStore) {
        stores.uiStore.setCurrentView('photos');
      } else {
        // Fallback: trigger a custom event
        window.dispatchEvent(new CustomEvent('navigate-to-photos'));
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check empty state
    await expect(page.locator('h1')).toContainText('My Images (0)');
    await expect(page.locator('text=No photos yet')).toBeVisible();
    
    // Test 3: Settings Button in Empty State
    console.log('✅ Testing Settings Button (Empty State)...');
    const settingsButton = page.locator('button[title="Settings"]');
    await expect(settingsButton).toBeVisible();
    
    // Click settings button
    await settingsButton.click();
    await page.waitForTimeout(500);
    
    // Check if reset modal appears
    await expect(page.locator('text=Reset App')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset")')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    
    // Test 4: Add Photos Button in Empty State
    console.log('✅ Testing Add Photos Button (Empty State)...');
    const addPhotosButton = page.locator('button:has-text("Add Photos")');
    await expect(addPhotosButton).toBeVisible();
    
    // Test 5: Simulate Adding Photos
    console.log('✅ Testing Photo Addition Flow...');
    
    // Create a mock photo file
    await page.evaluate(() => {
      // Create a simple canvas image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('TEST', 30, 50);
      }
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a mock file
          const file = new File([blob], 'test-photo.png', { type: 'image/png' });
          
          // Add to photo store
          const stores = (window as any).__ZUSTAND_STORES__;
          if (stores && stores.photoStore) {
            stores.photoStore.addPhotos([file]);
          }
        }
      }, 'image/png');
    });
    
    await page.waitForTimeout(2000);
    
    // Check if we have photos now
    await expect(page.locator('h1')).toContainText('My Images (1)');
    
    // Test 6: Settings Button with Photos
    console.log('✅ Testing Settings Button (With Photos)...');
    const settingsButtonWithPhotos = page.locator('button[title="Settings"]');
    await expect(settingsButtonWithPhotos).toBeVisible();
    
    // Click settings button
    await settingsButtonWithPhotos.click();
    await page.waitForTimeout(500);
    
    // Check if reset modal appears with photo count
    await expect(page.locator('text=Reset App')).toBeVisible();
    await expect(page.locator('text=This will delete all 1 photos')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);
    
    // Test 7: Photo Grid and Viewing
    console.log('✅ Testing Photo Grid and Viewing...');
    
    // Check if photo grid is visible
    await expect(page.locator('img')).toBeVisible();
    
    // Click on photo to view it
    await page.click('img');
    await page.waitForTimeout(500);
    
    // Check if we're in viewer
    await expect(page.locator('text=1 of 1')).toBeVisible();
    await expect(page.locator('button:has-text("←")')).toBeVisible();
    
    // Go back to photos
    await page.click('button:has-text("←")');
    await page.waitForTimeout(500);
    
    // Test 8: Photo Deletion
    console.log('✅ Testing Photo Deletion...');
    
    // Hover over photo to show delete button
    await page.hover('img');
    await page.waitForTimeout(500);
    
    // Click delete button
    const deleteButton = page.locator('button').filter({ hasText: '🗑️' });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      
      // Check if we're back to empty state
      await expect(page.locator('h1')).toContainText('My Images (0)');
      await expect(page.locator('text=No photos yet')).toBeVisible();
    }
    
    // Test 9: Reset App Function
    console.log('✅ Testing Reset App Function...');
    
    // Add a photo again
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'test-photo-2.png', { type: 'image/png' });
          const stores = (window as any).__ZUSTAND_STORES__;
          if (stores && stores.photoStore) {
            stores.photoStore.addPhotos([file]);
          }
        }
      }, 'image/png');
    });
    
    await page.waitForTimeout(2000);
    
    // Open settings and reset
    await page.click('button[title="Settings"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Reset")');
    await page.waitForTimeout(1000);
    
    // Check if we're back to welcome screen
    await expect(page.locator('h1')).toContainText('PHOTO WALLET');
    await expect(page.locator('button')).toContainText('Add Photos');
    
    console.log('🎉 All tests passed! Simplified app is working correctly.');
    
    // Take final screenshot
    await page.screenshot({ path: 'test-screenshots/simplified-app-test.png' });
  });
});
