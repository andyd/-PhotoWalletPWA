# Photo Wallet PWA - Claude Code Requirements Document

## Project Overview
Build a Progressive Web App (PWA) that recreates the experience of showing personal photos from a physical wallet. The app should work seamlessly on mobile devices with native-like functionality while being installable and running offline.

## Target Platform
- **Primary**: Progressive Web App (PWA)
- **Deployment**: Local development server for testing, with production-ready build
- **Compatibility**: Modern mobile browsers (iOS Safari 14+, Chrome Android 84+)
- **Installation**: Installable to home screen on mobile devices

## Technical Stack Requirements

### Core Technologies
- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **PWA Framework**: Workbox for service worker management
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API or Zustand for simple state management

### PWA Essential Features
- **Service Worker**: Offline functionality and caching
- **Web App Manifest**: Home screen installation capability
- **Responsive Design**: Mobile-first approach with touch-optimized interface
- **Local Storage**: IndexedDB for photo storage and metadata
- **File System Access**: File System Access API with fallback to input[type="file"]

## Core Functionality Requirements

### 1. Photo Import & Management
```typescript
// Required APIs and implementations
interface PhotoWallet {
  photos: Photo[];
  maxPhotos: 10;
  addPhotos(files: FileList): Promise<void>;
  removePhoto(id: string): void;
  reorderPhotos(fromIndex: number, toIndex: number): void;
}

interface Photo {
  id: string;
  blob: Blob;
  originalName: string;
  dateAdded: Date;
  order: number;
}
```

**Requirements**:
- Multi-select file input with accept="image/*"
- Maximum 10 photos enforced with clear error messaging
- Store full-resolution images in IndexedDB
- Drag-and-drop reordering with touch support
- Support JPEG, PNG, WebP, HEIC (where supported)

### 2. Viewing Experience
**Full-Screen Photo Viewer**:
- Launch directly into viewing mode
- Touch gesture support:
  - Swipe left/right for navigation
  - Pinch-to-zoom
  - Double-tap to zoom/reset
- Minimal UI with hidden browser chrome when possible
- Smooth transitions between photos
- Dark theme optimized for photo viewing

**Implementation Requirements**:
```typescript
// Use React libraries for gestures
- react-spring for smooth animations
- @use-gesture/react for touch gestures
- CSS transforms for zoom/pan functionality
```

### 3. PWA-Specific Features

**Installation & App Shell**:
- Web App Manifest with proper icons and theme colors
- Service worker for offline caching
- App shell architecture for instant loading
- Splash screen configuration

**Offline Functionality**:
- Complete offline operation after initial load
- All photos stored locally in IndexedDB
- No network requests after app installation

**Mobile Optimization**:
- Viewport meta tag configuration
- Touch target sizing (minimum 44px)
- Prevent zoom on form inputs
- iOS Safari address bar hiding
- Android Chrome theme color

## File Structure Requirements

```
photo-wallet-pwa/
├── public/
│   ├── manifest.json
│   ├── icons/ (various sizes)
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PhotoViewer.tsx
│   │   ├── PhotoManager.tsx
│   │   ├── PhotoUploader.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── usePhotoWallet.ts
│   │   ├── useGestures.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── photoStorage.ts
│   │   ├── fileHandler.ts
│   │   └── serviceWorker.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── imageProcessing.ts
│   │   └── constants.ts
│   ├── App.tsx
│   └── main.tsx
├── sw.js (service worker)
├── vite.config.ts
└── package.json
```

## Detailed Feature Specifications

### Photo Storage Service
```typescript
class PhotoStorageService {
  private dbName = 'PhotoWalletDB';
  private storeName = 'photos';

  async addPhoto(file: File): Promise<Photo>;
  async removePhoto(id: string): Promise<void>;
  async getAllPhotos(): Promise<Photo[]>;
  async updatePhotoOrder(photos: Photo[]): Promise<void>;
  async clearAllPhotos(): Promise<void>;
}
```

### Gesture Handling
- **Navigation**: Horizontal swipe with momentum
- **Zoom**: Pinch gesture with smooth scaling
- **Reset**: Double-tap to fit/fill screen
- **Boundary handling**: Prevent over-scroll, elastic boundaries

### Error Handling & UX
- **Storage Limit**: Clear modal when attempting to add 11th photo
- **File Type Errors**: Toast notifications for unsupported formats
- **Storage Quota**: Handle QuotaExceededError gracefully
- **Network Offline**: Visual indicator when service worker is active

## PWA Manifest Configuration

```json
{
  "name": "Photo Wallet",
  "short_name": "PhotoWallet",
  "description": "Personal photo wallet for quick sharing",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#000000",
  "categories": ["photography", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Performance Requirements

### Loading & Runtime
- **First Contentful Paint**: < 1.5 seconds
- **Time to Interactive**: < 3 seconds
- **Photo Load Time**: < 500ms per image
- **Gesture Response**: < 16ms (60fps)
- **Bundle Size**: < 1MB total JavaScript

### Memory Management
- **Image Caching**: Implement LRU cache for viewed photos
- **Blob URLs**: Proper cleanup to prevent memory leaks
- **IndexedDB**: Efficient query and storage patterns

## Development & Build Requirements

### Development Setup
```bash
# Required npm scripts
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run sw         # Generate service worker
npm run lighthouse # PWA audit
```

### Build Configuration
- **Vite PWA Plugin**: Auto-generate service worker
- **TypeScript**: Strict mode enabled
- **Bundle Analysis**: Visualize bundle size
- **PWA Audit**: Lighthouse CI integration

### Testing Requirements
- **Unit Tests**: Core functionality with Vitest
- **E2E Tests**: Photo workflow with Playwright
- **PWA Testing**: Service worker functionality
- **Cross-Browser**: iOS Safari, Chrome Android minimum

## Privacy & Security Specifications

### Data Policy
- **Zero External Requests**: No analytics, CDNs, or external APIs
- **Local Storage Only**: All data remains in user's browser
- **No Tracking**: No cookies, analytics, or user identification
- **Secure Context**: HTTPS required for service worker and File System API

### Browser Permissions
- **File Access**: User-initiated file selection only
- **Storage**: IndexedDB for local photo storage
- **Install Prompt**: Browser-managed PWA installation

## User Experience Flow

### First-Time User Journey
1. **Landing**: Simple splash screen with "Add Photos" CTA
2. **Permission**: Browser file picker access
3. **Onboarding**: Brief gesture tutorial overlay
4. **Install Prompt**: Encourage home screen installation

### Regular Usage Pattern
1. **Launch**: Instant load from service worker cache
2. **View Mode**: Immediate photo viewing with gestures
3. **Management**: Toggle to grid view for organization
4. **Offline**: Full functionality without internet

## Success Criteria

### Technical Metrics
- **Lighthouse PWA Score**: 100/100
- **Performance Score**: > 90
- **Accessibility Score**: > 95
- **Bundle Size**: < 1MB compressed
- **Offline Functionality**: 100% feature parity

### User Experience Metrics
- **Installation Rate**: Track PWA install events
- **Gesture Responsiveness**: No janky animations
- **Error Rate**: < 1% for core operations
- **Cross-Platform Consistency**: Identical UX on iOS/Android

## Deployment Strategy

### Development Phases
1. **Phase 1**: Core photo viewing and storage
2. **Phase 2**: Gesture handling and PWA features
3. **Phase 3**: Polish, performance optimization
4. **Phase 4**: Cross-browser testing and fixes

### Production Deployment
- **Static Hosting**: Vercel, Netlify, or GitHub Pages
- **HTTPS Requirement**: Essential for PWA features
- **Service Worker**: Automatic updates with user notification
- **Fallback Strategy**: Graceful degradation for unsupported browsers

---

This requirements document provides Claude Code with comprehensive specifications for building a production-ready Photo Wallet PWA that meets all your original mobile app requirements while leveraging modern web technologies for cross-platform compatibility.