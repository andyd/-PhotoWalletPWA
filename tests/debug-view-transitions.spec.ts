import { test } from '@playwright/test';

test('should debug view transitions when closing slideshow', async ({ page }) => {
  // Intercept all console logs to track view changes
  const logs: string[] = [];

  page.on('console', (msg) => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.goto('/');

  // Add debug logging to track view changes
  await page.addInitScript(() => {
    // Override console.log to track view changes
    const originalLog = console.log;
    window.originalLog = originalLog;

    // Override setCurrentView to log when it's called
    window.debugViewChanges = true;
  });

  await page.waitForLoadState('networkidle');

  // Upload a photo
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'purple';
      ctx.fillRect(0, 0, 100, 100);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);

        const file = new File([blob], 'debug.png', { type: 'image/png' });
        const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;

        if (fileInput) {
          const dt = new DataTransfer();
          dt.items.add(file);
          Object.defineProperty(fileInput, 'files', {
            value: dt.files,
            configurable: true
          });
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        resolve(true);
      }, 'image/png');
    });
  });

  await page.waitForTimeout(2000);

  // Track current view
  let currentView = await page.evaluate(() => {
    const content = document.querySelector('#root')?.textContent || '';
    if (content.includes('Photo Wallet (')) return 'manager';
    if (content.includes('Settings')) return 'settings';
    if (content.includes('Add up to 10 photos')) return 'uploader';
    return 'unknown';
  });

  console.log('1. After upload, current view:', currentView);

  // Start slideshow
  await page.locator('text=Start Slideshow').click();
  await page.waitForTimeout(1000);

  currentView = await page.evaluate(() => {
    // In viewer, we look for image elements and viewer-specific UI
    const hasImg = document.querySelectorAll('img').length > 0;
    const hasViewerUI = document.querySelector('.fixed.inset-0.bg-black.z-50');
    if (hasViewerUI && hasImg) return 'viewer';

    const content = document.querySelector('#root')?.textContent || '';
    if (content.includes('Photo Wallet (')) return 'manager';
    if (content.includes('Settings')) return 'settings';
    if (content.includes('Add up to 10 photos')) return 'uploader';
    return 'unknown';
  });

  console.log('2. After starting slideshow, current view:', currentView);

  // Add event listener to track what happens when we press Escape
  await page.evaluate(() => {
    window.addEventListener('keydown', (e) => {
      console.log('Key pressed:', e.key);
      if (e.key === 'Escape') {
        console.log('Escape pressed - should close viewer');
      }
    });

    // Track when the component state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const content = document.querySelector('#root')?.textContent || '';
          let view = 'unknown';
          if (content.includes('Photo Wallet (')) view = 'manager';
          else if (content.includes('Settings')) view = 'settings';
          else if (content.includes('Add up to 10 photos')) view = 'uploader';
          else if (document.querySelector('.fixed.inset-0.bg-black.z-50')) view = 'viewer';

          console.log('DOM changed - detected view:', view);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  });

  // Press Escape to close
  console.log('3. Pressing Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  currentView = await page.evaluate(() => {
    const content = document.querySelector('#root')?.textContent || '';
    if (content.includes('Photo Wallet (')) return 'manager';
    if (content.includes('Settings')) return 'settings';
    if (content.includes('Add up to 10 photos')) return 'uploader';
    const hasViewerUI = document.querySelector('.fixed.inset-0.bg-black.z-50');
    if (hasViewerUI) return 'viewer';
    return 'unknown';
  });

  console.log('4. After Escape, current view:', currentView);

  // Get the last several console logs to see what happened
  console.log('\n--- Console logs from page ---');
  logs.slice(-20).forEach(log => console.log(log));

  await page.screenshot({ path: 'test-results/debug-final-state.png' });
});