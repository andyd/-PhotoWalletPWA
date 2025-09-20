import { test } from '@playwright/test';

test('Force clear all data', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Force clear everything
  await page.evaluate(async () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear all IndexedDB databases
    try {
      const databases = await indexedDB.databases();
      console.log('Found databases:', databases);

      for (const db of databases) {
        if (db.name) {
          console.log('Deleting database:', db.name);
          const deleteRequest = indexedDB.deleteDatabase(db.name);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => {
              console.log('Successfully deleted:', db.name);
              resolve(true);
            };
            deleteRequest.onerror = () => {
              console.error('Failed to delete:', db.name);
              reject(deleteRequest.error);
            };
            deleteRequest.onblocked = () => {
              console.log('Delete blocked for:', db.name);
              resolve(true);
            };
          });
        }
      }
    } catch (error) {
      console.error('Error clearing databases:', error);
    }

    // Clear any cache storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
    }

    console.log('All data cleared');
  });

  // Reload to ensure clean state
  await page.reload();
  await page.waitForTimeout(2000);

  console.log('Database clearing completed');
});