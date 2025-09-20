import { test, expect } from '@playwright/test';

test('Debug upload area visibility', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5174');
  await page.waitForTimeout(2000);

  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Take screenshot
  await page.screenshot({ path: 'debug-upload-missing.png', fullPage: true });

  // Check if upload area exists
  const uploadArea = page.locator('#photo-drop-zone');
  const uploadAreaExists = await uploadArea.isVisible().catch(() => false);
  console.log('Upload area exists:', uploadAreaExists);

  if (!uploadAreaExists) {
    // Check if it exists but is hidden
    const uploadAreaInDOM = await page.locator('#photo-drop-zone').count();
    console.log('Upload area in DOM:', uploadAreaInDOM);

    // Check viewport dimensions that might be affecting layout
    const viewport = await page.viewportSize();
    console.log('Viewport:', viewport);

    // Check if there are any CSS issues
    const styles = await uploadArea.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        position: computed.position,
        height: computed.height,
        width: computed.width
      };
    }).catch(() => null);
    console.log('Upload area styles:', styles);
  }

  // Check container elements
  const container = page.locator('.max-w-md');
  const containerVisible = await container.isVisible().catch(() => false);
  console.log('Container visible:', containerVisible);

  // Check for welcome screen elements
  const welcomeTitle = page.locator('text=Photo Wallet');
  const welcomeTitleVisible = await welcomeTitle.isVisible().catch(() => false);
  console.log('Welcome title visible:', welcomeTitleVisible);

  const uploadText = page.locator('text=Add your first photos');
  const uploadTextVisible = await uploadText.isVisible().catch(() => false);
  console.log('Upload text visible:', uploadTextVisible);

  // Log all visible text to understand what's rendering
  const allText = await page.textContent('body');
  console.log('All visible text on page:', allText?.replace(/\s+/g, ' ').trim());
});