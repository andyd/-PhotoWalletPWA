import { test } from '@playwright/test';

test('debug blank page issue', async ({ page }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`Page error: ${error.message}`);
  });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000);

  console.log('=== PAGE CONTENT ===');
  const content = await page.content();
  console.log('HTML length:', content.length);

  console.log('\n=== PAGE TEXT ===');
  const text = await page.textContent('body');
  console.log('Body text:', text);

  console.log('\n=== ERRORS ===');
  errors.forEach(error => console.log('ERROR:', error));

  console.log('\n=== REACT ROOT ===');
  const rootExists = await page.locator('#root').count();
  console.log('Root element exists:', rootExists > 0);

  if (rootExists > 0) {
    const rootContent = await page.locator('#root').textContent();
    console.log('Root content:', rootContent);
  }

  await page.screenshot({ path: 'test-results/debug-blank-page.png' });
});