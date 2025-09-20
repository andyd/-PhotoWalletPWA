import { test, expect } from '@playwright/test';

test('Check Photo Wallet PWA app loads correctly', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for the app to load
  await page.waitForTimeout(2000);

  // Take a screenshot to see what's displayed
  await page.screenshot({ path: 'app-screenshot.png', fullPage: true });

  // Check for any console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Check if the page title is correct
  await expect(page).toHaveTitle(/Photo Wallet/);

  // Look for the main app content
  const body = await page.textContent('body');
  console.log('Page content:', body);

  // Check for error messages
  const errorElement = await page.locator('[class*="error"]').first();
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log('Error found:', errorText);
  }

  // Check for React error boundary
  const errorBoundary = await page.locator('text=Something went wrong').first();
  if (await errorBoundary.isVisible()) {
    console.log('React error boundary triggered');
  }

  // Look for the welcome screen
  const welcomeText = await page.locator('text=Photo Wallet').first();
  if (await welcomeText.isVisible()) {
    console.log('Welcome screen found');
  } else {
    console.log('Welcome screen not found');
  }

  // Print any console errors
  if (errors.length > 0) {
    console.log('Console errors:', errors);
  }
});