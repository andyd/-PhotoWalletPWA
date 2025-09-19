# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Photo Wallet PWA is a Progressive Web App that recreates the experience of showing personal photos from a physical wallet. Built with React 18, TypeScript, and Vite.

## Development Commands

```bash
# Start development server
npm run dev

# Production build
npm run build

# Build and preview production
npm run build && npm run preview

# Run tests (Playwright)
npx playwright test

# Run specific test
npx playwright test tests/filename.spec.ts

# Generate service worker
npm run sw

# Lighthouse PWA audit
npm run lighthouse

# Deploy to GitHub Pages
npm run deploy
```

## Architecture Overview

### State Management
- **usePhotoWallet**: Main state hook managing photos, views, loading states, and errors (`src/hooks/usePhotoWallet.ts`)
- **AppContext**: React Context providing app-wide state via provider pattern (`src/contexts/AppContext.tsx`)
- **IndexedDB**: Persistent storage via `photoStorageService` (`src/services/photoStorage.ts`)

### View System
The app has three main views controlled by `currentView` state:
- `setup`: Photo upload interface when no photos exist
- `home`: Grid view for photo management and navigation
- `slide`: Full-screen photo viewer with gesture support

View transitions are handled by navigation actions in `usePhotoWallet`:
- `goToSetup()`, `goToHome()`, `goToSlide(index)`

### Photo Management Flow
1. Photos uploaded via drag/drop or file picker (`PhotoUploader`)
2. Validated and processed (`validateImageFile` in `utils/imageProcessing.ts`)
3. Stored in IndexedDB with blob data (`photoStorageService.addPhoto`)
4. Displayed in grid (`PhotoManager`) or viewer (`PhotoViewer`)
5. Reorderable via drag/drop with persistent order updates

### Gesture System
- **Touch Gestures**: Implemented with `@use-gesture/react` and `react-spring`
- **Photo Navigation**: Horizontal swipes in `PhotoViewer`
- **Zoom/Pan**: Pinch zoom and pan gestures with momentum
- **Settings Trigger**: Double-tap on home view opens settings

### PWA Features
- **Service Worker**: Auto-generated via Vite PWA plugin
- **Offline Support**: Complete functionality without network
- **Install Prompt**: Native installation banner
- **App Manifest**: Configured for standalone mobile experience

## Key Files

- `src/App.tsx`: Main app component with view routing
- `src/hooks/usePhotoWallet.ts`: Central state management
- `src/services/photoStorage.ts`: IndexedDB operations
- `src/components/PhotoViewer.tsx`: Full-screen viewer with gestures
- `src/components/PhotoManager.tsx`: Grid view with drag/drop
- `vite.config.ts`: Build configuration with PWA setup

## Testing

Uses Playwright for end-to-end testing:
- Test assets located in `tests/assets/`
- Tests cover photo upload, navigation, gestures, and settings
- Run tests against development server on `http://localhost:5173`

## Bundle Configuration

Vite configuration includes manual chunks:
- `vendor`: React and React DOM
- `gestures`: Gesture and animation libraries

Base path set to `/-PhotoWalletPWA/` for GitHub Pages deployment.

## Common Patterns

- All photos must have blob data and metadata (id, originalName, order)
- State updates go through `usePhotoWallet` actions
- Error handling via error state with type and message
- Loading states for async operations
- Gesture bindings applied conditionally based on current view