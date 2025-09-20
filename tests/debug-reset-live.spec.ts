import { test, expect } from '@playwright/test';

test('Debug live reset functionality', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  // Navigate to the app
  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'debug-live-start.png', fullPage: true });

  // Check if we have photos (grid layout vs welcome screen)
  const hasPhotoGrid = await page.locator('.grid.grid-cols-2').isVisible().catch(() => false);
  const hasWelcomeScreen = await page.locator('text=Add your first photos').isVisible().catch(() => false);

  console.log('Has photo grid:', hasPhotoGrid);
  console.log('Has welcome screen:', hasWelcomeScreen);

  if (hasPhotoGrid) {
    console.log('🔍 Photos detected - attempting reset...');

    // Look for either reset button
    const bottomResetButton = page.locator('button[title="Reset App (Development)"]');
    const settingsButton = page.locator('button[title="Settings & Reset"]');

    const bottomResetVisible = await bottomResetButton.isVisible().catch(() => false);
    const settingsVisible = await settingsButton.isVisible().catch(() => false);

    console.log('Bottom reset visible:', bottomResetVisible);
    console.log('Settings button visible:', settingsVisible);

    // Try settings button first (more reliable)
    if (settingsVisible) {
      console.log('🖱️ Clicking settings button...');
      await settingsButton.click();
    } else if (bottomResetVisible) {
      console.log('🖱️ Clicking bottom reset button...');
      await bottomResetButton.click();
    } else {
      console.log('❌ No reset buttons found');
      return;
    }

    // Wait for modal
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-live-modal.png', fullPage: true });

    const modalVisible = await page.locator('text=Reset Photo Wallet?').isVisible().catch(() => false);
    console.log('Modal appeared:', modalVisible);

    if (modalVisible) {
      // Click the actual reset button
      console.log('🔄 Clicking Reset App button in modal...');
      await page.click('button:has-text("Reset App")');

      // Wait for the reset process - it should reload the page
      console.log('⏳ Waiting for reset to complete...');
      await page.waitForTimeout(10000); // Wait longer for reload

      // Take screenshot after reset
      await page.screenshot({ path: 'debug-live-after-reset.png', fullPage: true });

      // Check if we're now on welcome screen
      const nowHasWelcome = await page.locator('text=Add your first photos').isVisible().catch(() => false);
      const stillHasPhotos = await page.locator('.grid.grid-cols-2').isVisible().catch(() => false);

      console.log('After reset - Has welcome:', nowHasWelcome);
      console.log('After reset - Still has photos:', stillHasPhotos);

      if (stillHasPhotos) {
        console.log('❌ RESET FAILED - Photos still present');

        // Let's check what's in IndexedDB
        const dbData = await page.evaluate(async () => {
          const databases = await indexedDB.databases();
          return databases.map(db => db.name);
        });
        console.log('Remaining databases:', dbData);

        // Check localStorage
        const localStorageData = await page.evaluate(() => {
          const data = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) data[key] = localStorage.getItem(key);
          }
          return data;
        });
        console.log('LocalStorage data:', localStorageData);

      } else {
        console.log('✅ RESET SUCCESSFUL');
      }
    } else {
      console.log('❌ Modal did not appear');
    }
  } else {
    console.log('✅ Already on welcome screen - no photos to reset');
  }
});