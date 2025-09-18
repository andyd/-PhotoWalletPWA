import { test, expect } from '@playwright/test';

test('Simplified app - test all functionality', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5174/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Clear any existing photos
  await page.evaluate(() => {
    indexedDB.deleteDatabase('PhotoWalletDB');
  });
  await page.reload();
  await page.waitForTimeout(3000);
  
  // Should be on setup screen initially
  const setupText = page.locator('text=Add photos to your wallet');
  await expect(setupText).toBeVisible();
  console.log('✅ On setup screen initially');
  
  // Upload test images
  const testImagePaths = [
    '/Users/andyd/My Drive/CODE PROJECTS/PhotoWalletPWA/tests/assets/test-image-1.jpg',
    '/Users/andyd/My Drive/CODE PROJECTS/PhotoWalletPWA/tests/assets/test-image-2.jpg',
    '/Users/andyd/My Drive/CODE PROJECTS/PhotoWalletPWA/tests/assets/test-image-3.jpg'
  ];
  
  const dropArea = page.locator('.border-dashed');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await dropArea.click();
  const fileChooser = await fileChooserPromise;
  
  await fileChooser.setFiles(testImagePaths);
  await page.waitForTimeout(3000);
  
  // Should be on home screen with images
  const homeTitle = page.locator('text=Photo Wallet');
  await expect(homeTitle).toBeVisible();
  
  const imageGrid = page.locator('.grid');
  const images = imageGrid.locator('img');
  const imageCount = await images.count();
  console.log('Image count on home:', imageCount);
  
  if (imageCount > 0) {
    console.log('✅ Images visible on home screen');
    
    // Test clicking image to enter slideshow
    const firstImage = images.first();
    await firstImage.click();
    await page.waitForTimeout(1000);
    
    // Should be in slideshow
    const slideshowContainer = page.locator('.fixed.inset-0.bg-black.z-50');
    await expect(slideshowContainer).toBeVisible();
    console.log('✅ In slideshow mode');
    
    // Test escape to exit slideshow
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Should be back on home screen with images
    await expect(homeTitle).toBeVisible();
    const imagesAfterExit = imageGrid.locator('img');
    const imageCountAfterExit = await imagesAfterExit.count();
    console.log('Image count after exit:', imageCountAfterExit);
    
    if (imageCountAfterExit > 0) {
      console.log('✅ Images still visible after exiting slideshow');
    } else {
      console.log('❌ Images not visible after exiting slideshow');
    }
    
    // Test settings functionality
    const settingsButton = page.locator('button[title="Settings"]');
    await settingsButton.click();
    await page.waitForTimeout(1000);
    
    const settingsPanel = page.locator('text=Settings');
    await expect(settingsPanel).toBeVisible();
    console.log('✅ Settings panel opened');
    
    // Close settings
    const closeSettingsButton = page.locator('button:has-text("Close")');
    await closeSettingsButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Settings panel closed');
    
    // Test add photos functionality
    const addButton = page.locator('button[title="Add Photos"]');
    await addButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Add photos button clicked');
    
  } else {
    console.log('❌ No images found on home screen');
  }
  
  console.log('Simplified app test completed');
});
