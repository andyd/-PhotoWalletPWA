import { test, expect } from '@playwright/test';

test.describe('Slideshow Navigation', () => {
  test('should navigate to slideshow when clicking on image from home screen', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5174/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on setup screen first
    const setupScreen = page.locator('text=Add photos to your wallet');
    if (await setupScreen.isVisible()) {
      // Upload a test image
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });
      
      // Wait for upload to complete and navigate to home
      await page.waitForTimeout(2000);
    }
    
    // Check if we're on home screen
    await expect(page.locator('text=Photo Wallet')).toBeVisible();
    
    // Look for images in the grid
    const imageGrid = page.locator('.grid.grid-cols-2');
    await expect(imageGrid).toBeVisible();
    
    // Find the first image and click it
    const firstImage = imageGrid.locator('div').first();
    await firstImage.click();
    
    // Check if we're now in slideshow view
    // Look for slideshow-specific elements
    const slideshowElements = [
      page.locator('text=1 of'), // Photo counter
      page.locator('button[aria-label="Close"]'), // Close button
      page.locator('button[aria-label="Previous"]'), // Previous button
      page.locator('button[aria-label="Next"]') // Next button
    ];
    
    // At least one slideshow element should be visible
    const visibleElements = await Promise.all(
      slideshowElements.map(async (element) => await element.isVisible())
    );
    
    const hasSlideshowElements = visibleElements.some(visible => visible);
    expect(hasSlideshowElements).toBe(true);
    
    console.log('Slideshow test completed');
  });
  
  test('should start slideshow from play button', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5174/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on setup screen first
    const setupScreen = page.locator('text=Add photos to your wallet');
    if (await setupScreen.isVisible()) {
      // Upload a test image
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });
      
      // Wait for upload to complete and navigate to home
      await page.waitForTimeout(2000);
    }
    
    // Check if we're on home screen
    await expect(page.locator('text=Photo Wallet')).toBeVisible();
    
    // Find and click the play button
    const playButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
    await playButton.click();
    
    // Check if we're now in slideshow view
    const slideshowElements = [
      page.locator('text=1 of'), // Photo counter
      page.locator('button[aria-label="Close"]'), // Close button
    ];
    
    // At least one slideshow element should be visible
    const visibleElements = await Promise.all(
      slideshowElements.map(async (element) => await element.isVisible())
    );
    
    const hasSlideshowElements = visibleElements.some(visible => visible);
    expect(hasSlideshowElements).toBe(true);
    
    console.log('Play button test completed');
  });
});
