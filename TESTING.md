# 📸 Photo Wallet Testing Guide

## 🚀 Live App
- **GitHub Pages**: https://andyd.github.io/-PhotoWalletPWA/
- **Local Development**: http://localhost:5173/

## 🧪 Testing the App

### 1. Generate Test Images
1. Open `create-sample-images.html` in your browser
2. Click "Generate Test Images" 
3. The images will be downloaded to your Downloads folder
4. Use these images to test the Photo Wallet app

### 2. Test Scenarios

#### ✅ Basic Photo Upload
1. Open the app (local or GitHub Pages)
2. Click "Add Photos" or the + button
3. Select multiple test images
4. **Expected**: Photos should appear immediately in the home view
5. **Expected**: No page reload required

#### ✅ Photo Management
1. Upload some photos
2. Click on a photo to view in slideshow
3. Use swipe gestures to navigate
4. Press Escape or swipe down to return to home
5. **Expected**: All photos should still be visible

#### ✅ PWA Features
1. On mobile: Look for "Add to Home Screen" prompt
2. Install the app
3. **Expected**: App should work offline
4. **Expected**: App should look like a native app

#### ✅ Settings & Management
1. Click the settings gear icon
2. Test "Clear All Photos" functionality
3. **Expected**: All photos should be removed
4. **Expected**: App should return to setup view

### 3. Bug Testing (Fixed Issues)

#### ✅ Photo Upload Bug (FIXED)
- **Issue**: After uploading photos, app would go to wrong view
- **Fix**: App now always goes to home view after upload
- **Test**: Upload photos and verify they appear immediately

### 4. Performance Testing
- Upload 10+ photos
- Test slideshow performance
- Test offline functionality
- Test on different devices (mobile/desktop)

## 🛠️ Development

### Local Development
```bash
npm run dev
```

### Build & Deploy
```bash
npm run build
npm run deploy
```

### Run Tests
```bash
npx playwright test
```

## 📱 PWA Features
- ✅ Offline functionality
- ✅ Installable on mobile
- ✅ Touch gestures
- ✅ Full-screen experience
- ✅ Service worker caching

## 🐛 Known Issues
- None currently! The photo upload bug has been fixed.

## 🎯 Test Images
Use the `create-sample-images.html` file to generate test images with different colors and themes for comprehensive testing.
