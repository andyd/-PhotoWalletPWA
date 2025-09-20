import { test } from '@playwright/test';

test('Clear IndexedDB data', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Clear IndexedDB
  await page.evaluate(() => {
    // Clear all IndexedDB databases
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    });

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  console.log('IndexedDB and storage cleared');
  await page.reload();
});