import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Photo Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the photo uploader on first visit', async ({ page }) => {
    // Check if uploader is visible
    await expect(page.locator('text=Photo Wallet')).toBeVisible();
    await expect(page.locator('text=Add up to 10 photos to your wallet')).toBeVisible();
    await expect(page.locator('text=Add Photos')).toBeVisible();
  });

  test('should handle photo upload', async ({ page }) => {
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image.png');

    // Create a simple test image (1x1 pixel PNG)
    const testImage = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Write test image to filesystem temporarily
    await page.evaluate(async (imageData) => {
      const fs = require('fs');
      fs.writeFileSync('/tmp/test-image.png', Buffer.from(imageData));
    }, Array.from(testImage));

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for unhandled errors
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Click the upload area
    await page.locator('text=Add Photos').click();

    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').click();
    const fileChooser = await fileChooserPromise;

    // Upload the file - for testing, we'll create a File object in the browser
    await page.evaluate(async () => {
      // Create a test image file in the browser
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }

      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object
            const file = new File([blob], 'test-image.png', { type: 'image/png' });

            // Create FileList
            const dt = new DataTransfer();
            dt.items.add(file);

            // Find file input and set files
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) {
              input.files = dt.files;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
          resolve(true);
        }, 'image/png');
      });
    });

    // Wait a bit for the upload to process
    await page.waitForTimeout(2000);

    // Check for errors
    console.log('Console errors:', consoleErrors);
    console.log('Page errors:', pageErrors);

    // Check if we moved to manager view or if photos are visible
    await page.screenshot({ path: 'test-results/after-upload.png' });

    // Try to find any photos or photo-related elements
    const hasPhotos = await page.locator('[data-testid="photo-item"]').count();
    const hasManager = await page.locator('text=Photo Wallet (').isVisible();
    const hasGrid = await page.locator('.grid').isVisible();

    console.log('Has photos:', hasPhotos);
    console.log('Has manager:', hasManager);
    console.log('Has grid:', hasGrid);

    // Check current view
    const currentText = await page.textContent('body');
    console.log('Page content contains:', {
      hasAddPhotos: currentText?.includes('Add Photos'),
      hasPhotoWallet: currentText?.includes('Photo Wallet'),
      hasUpload: currentText?.includes('upload'),
      hasManager: currentText?.includes('Photo Wallet ('),
    });
  });

  test('should show console and network activity', async ({ page }) => {
    const logs: string[] = [];
    const networkRequests: string[] = [];

    // Capture console logs
    page.on('console', (msg) => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture network requests
    page.on('request', (request) => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });

    // Capture responses
    page.on('response', (response) => {
      if (!response.ok()) {
        logs.push(`Failed response: ${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    console.log('Console logs:', logs);
    console.log('Network requests:', networkRequests);

    // Try to access IndexedDB
    const dbTest = await page.evaluate(async () => {
      try {
        const request = indexedDB.open('PhotoWalletDB', 1);
        return new Promise((resolve, reject) => {
          request.onerror = () => resolve({ error: 'Failed to open DB' });
          request.onsuccess = () => {
            const db = request.result;
            resolve({
              success: true,
              name: db.name,
              version: db.version,
              stores: Array.from(db.objectStoreNames)
            });
          };
          request.onupgradeneeded = () => {
            resolve({ upgradeNeeded: true });
          };
        });
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('IndexedDB test:', dbTest);
  });
});