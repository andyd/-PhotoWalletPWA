import { test, expect } from '@playwright/test';

test('Test My Photos title and persistence on reload', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Test 1: Add some photos to get to My Photos page
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 100, 100);
    }
    
    const blob = new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    blob.then((blob) => {
      const file = new File([blob], 'test1.png', { type: 'image/png' });
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { value: input });
      input.dispatchEvent(event);
    });
  });
  
  await page.waitForTimeout(3000);
  
  // Test 2: Check if we're on My Photos page with correct title
  const title = await page.textContent('h1');
  console.log('Title after adding photos:', title);
  
  if (title?.includes('My Photos')) {
    console.log('✅ Title correctly shows "My Photos"');
    
    // Test 3: Check if settings button is in upper right corner
    const settingsButton = page.locator('button[title="Settings"]');
    const settingsCount = await settingsButton.count();
    
    if (settingsCount > 0) {
      console.log('✅ Settings button found');
      
      const settingsBox = await settingsButton.boundingBox();
      const viewportSize = page.viewportSize();
      
      if (settingsBox && viewportSize) {
        // Check if settings button is in upper right area
        const isInUpperRight = settingsBox.x > viewportSize.width * 0.7 && settingsBox.y < viewportSize.height * 0.3;
        
        if (isInUpperRight) {
          console.log('✅ Settings button is in upper right corner');
        } else {
          console.log('❌ Settings button is not in upper right corner');
          console.log(`Position: x=${settingsBox.x}, y=${settingsBox.y}`);
          console.log(`Viewport: width=${viewportSize.width}, height=${viewportSize.height}`);
        }
      }
    } else {
      console.log('❌ Settings button not found');
    }
    
    // Test 4: Add another photo
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }
      
      const blob = new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      blob.then((blob) => {
        const file = new File([blob], 'test2.png', { type: 'image/png' });
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        const event = new Event('change', { bubbles: true });
        Object.defineProperty(event, 'target', { value: input });
        input.dispatchEvent(event);
      });
    });
    
    await page.waitForTimeout(2000);
    
    // Test 5: Check if title shows correct count
    const titleWithCount = await page.textContent('h1');
    console.log('Title with count:', titleWithCount);
    
    if (titleWithCount?.includes('My Photos (2)')) {
      console.log('✅ Title shows correct photo count');
    } else {
      console.log('❌ Title does not show correct photo count');
    }
    
    // Test 6: Reload page and check if it stays on My Photos
    await page.reload();
    await page.waitForTimeout(3000);
    
    const titleAfterReload = await page.textContent('h1');
    console.log('Title after reload:', titleAfterReload);
    
    if (titleAfterReload?.includes('My Photos')) {
      console.log('✅ App stays on My Photos page after reload');
      
      // Check if photos are still there
      if (titleAfterReload.includes('(2)')) {
        console.log('✅ Photos persist after reload');
      } else {
        console.log('❌ Photos do not persist after reload');
      }
    } else {
      console.log('❌ App resets to welcome page after reload');
    }
    
  } else {
    console.log('❌ Title does not show "My Photos"');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'test-screenshots/my-photos-and-persistence.png', fullPage: true });
  
  console.log('✅ My Photos and persistence test completed');
});
