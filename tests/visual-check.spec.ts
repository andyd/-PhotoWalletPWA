import { test, expect } from '@playwright/test';

test('Visual check - Desktop and Mobile responsiveness', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Desktop view first
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: 'visual-desktop-1280.png', fullPage: true });
  console.log('📱 Desktop (1280x720) screenshot taken');

  // Tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'visual-tablet-768.png', fullPage: true });
  console.log('📱 Tablet (768x1024) screenshot taken');

  // Mobile view - iPhone sized
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'visual-mobile-375.png', fullPage: true });
  console.log('📱 Mobile (375x667) screenshot taken');

  // Small mobile - iPhone SE
  await page.setViewportSize({ width: 320, height: 568 });
  await page.screenshot({ path: 'visual-mobile-320.png', fullPage: true });
  console.log('📱 Small Mobile (320x568) screenshot taken');

  // Large mobile - iPhone Plus
  await page.setViewportSize({ width: 414, height: 736 });
  await page.screenshot({ path: 'visual-mobile-414.png', fullPage: true });
  console.log('📱 Large Mobile (414x736) screenshot taken');

  // Check if elements are properly spaced
  const container = page.locator('.max-w-md');
  const containerExists = await container.isVisible().catch(() => false);
  console.log('Container with max-width exists:', containerExists);

  // Check padding on main elements
  const mainContent = page.locator('.min-h-screen');
  const hasMainContent = await mainContent.isVisible().catch(() => false);
  console.log('Main content container exists:', hasMainContent);

  // Check if text is readable at different sizes
  const welcomeText = page.locator('text=Photo Wallet');
  const textVisible = await welcomeText.isVisible().catch(() => false);
  console.log('Welcome text visible:', textVisible);

  console.log('✅ Visual check complete - check screenshots for spacing issues');
});