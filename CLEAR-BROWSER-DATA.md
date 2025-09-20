# 🧹 FORCE CLEAR ALL BROWSER DATA

## Method 1: Chrome DevTools Console (RECOMMENDED)

1. **Open Chrome** and go to `http://localhost:5174`
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Paste this script** and press Enter:

```javascript
// AGGRESSIVE BROWSER DATA CLEARING
console.log('🧹 Starting complete data wipe...');

// Clear all storage
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');

// Clear all IndexedDB databases
(async () => {
  try {
    const databases = await indexedDB.databases();
    console.log('🔍 Found databases:', databases.map(db => db.name));

    for (const db of databases) {
      if (db.name) {
        await new Promise((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(db.name);
          deleteRequest.onsuccess = () => {
            console.log(`🗑️ Deleted: ${db.name}`);
            resolve();
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();

// Unregister service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🧹 Service worker unregistered');
    });
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      .then(() => console.log('🧹 All caches cleared'));
  });
}

console.log('✅ Complete! Now refresh with Ctrl+Shift+R');
```

5. **Wait 2 seconds** for the script to complete
6. **Hard refresh** with **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)

## Method 2: Chrome Settings (NUCLEAR OPTION)

1. **Chrome Menu** → **More Tools** → **Clear Browsing Data**
2. **Time range**: "All time"
3. **Check ALL boxes**: Cookies, Cached images, Site data, etc.
4. **Click "Clear data"**
5. **Restart Chrome completely**
6. **Go to** `http://localhost:5174`

## Method 3: Incognito Mode (CLEAN SLATE)

1. **Open Incognito Window** (Ctrl+Shift+N)
2. **Go to** `http://localhost:5174`
3. **This will be completely clean** with no stored data

---

After clearing, you should see the clean Photo Wallet welcome screen with "Add your first photos" and the reset button in the bottom left corner should work properly.