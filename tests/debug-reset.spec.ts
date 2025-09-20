import { test, expect } from '@playwright/test';

test('Debug reset button and existing images', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5174');

  // Wait for the app to load
  await page.waitForTimeout(3000);

  // Take screenshot to see current state
  await page.screenshot({ path: 'debug-current-state.png', fullPage: true });

  // Check if we're on manager view (has photos) or welcome view
  const hasPhotos = await page.locator('.grid.grid-cols-2').isVisible().catch(() => false);
  const isWelcome = await page.locator('text=Add your first photos').isVisible().catch(() => false);

  console.log('Has photos:', hasPhotos);
  console.log('Is welcome view:', isWelcome);

  if (hasPhotos) {
    console.log('🔍 Found photos - looking for reset button in PhotoGrid component');

    // Look for reset button in bottom left
    const resetButton = page.locator('button[title="Reset App (Development)"]');
    const resetButtonVisible = await resetButton.isVisible();
    console.log('Reset button visible:', resetButtonVisible);

    if (resetButtonVisible) {
      console.log('🖱️ Clicking reset button...');
      await resetButton.click();

      // Wait for modal
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-modal-attempt.png', fullPage: true });

      // Check if modal appeared
      const modalVisible = await page.locator('text=Reset Photo Wallet?').isVisible().catch(() => false);
      console.log('Modal visible:', modalVisible);

      if (modalVisible) {
        // Click reset button in modal
        await page.click('button:has-text("Reset App")');
        console.log('🔄 Clicked Reset App button');

        // Wait for page reload
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'debug-after-reset.png', fullPage: true });
      } else {
        console.log('❌ Modal did not appear');
      }
    } else {
      console.log('❌ Reset button not visible');
    }
  } else if (isWelcome) {
    console.log('✅ Already on welcome view - no photos to reset');
  } else {
    console.log('❓ Unknown view state');
  }

  // Check console for any errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  // Check final state
  await page.screenshot({ path: 'debug-final-state.png', fullPage: true });
});