// Run this in Chrome DevTools Console to force clear everything
console.log('🧹 Starting aggressive browser cache clearing...');

// 1. Clear all localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// 2. Clear all sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// 3. Clear all IndexedDB databases
(async () => {
  try {
    const databases = await indexedDB.databases();
    console.log('Found databases:', databases.map(db => db.name));

    for (const db of databases) {
      if (db.name) {
        const deleteRequest = indexedDB.deleteDatabase(db.name);
        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = resolve;
          deleteRequest.onerror = reject;
        });
        console.log(`✅ Deleted database: ${db.name}`);
      }
    }
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
})();

// 4. Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('✅ Service worker unregistered');
    });
  });
}

// 5. Clear all caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
      console.log(`✅ Cache deleted: ${cacheName}`);
    });
  });
}

console.log('🎉 Cache clearing complete! Now hard refresh the page with Ctrl+Shift+R (or Cmd+Shift+R on Mac)');