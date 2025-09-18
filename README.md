# Photo Wallet PWA

A Progressive Web App that recreates the experience of showing personal photos from a physical wallet. Built with modern web technologies for seamless mobile experience with native-like functionality.

## Features

### 📱 Mobile-First Design
- **Touch Gestures**: Swipe to navigate, pinch to zoom, double-tap to reset
- **Full-Screen Viewing**: Immersive photo viewing experience
- **PWA Installation**: Install to home screen for app-like experience
- **Offline Support**: Complete functionality without internet connection

### 🖼️ Photo Management
- **Upload Photos**: Add up to 10 photos via file picker or drag & drop
- **Reorder Photos**: Drag and drop to organize your photo order
- **Local Storage**: All photos stored securely in your browser using IndexedDB
- **Multiple Formats**: Support for JPEG, PNG, WebP, and HEIC images

### 🔒 Privacy & Security
- **Zero External Requests**: No analytics, CDNs, or external APIs
- **Local Storage Only**: All data remains in your browser
- **No Tracking**: No cookies, analytics, or user identification
- **Secure Context**: HTTPS required for service worker functionality

## Technical Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for responsive design
- **PWA**: Workbox for service worker management
- **Gestures**: @use-gesture/react and react-spring for smooth interactions
- **Storage**: IndexedDB via idb library for photo persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with IndexedDB support
- HTTPS required for PWA features in production

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd photo-wallet-pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run preview    # Preview production build
npm run sw         # Generate service worker
npm run lighthouse # PWA audit
```

## PWA Features

### Installation
- Automatically prompts users to install on supported devices
- Creates app icon on home screen
- Launches in standalone mode (no browser UI)

### Offline Functionality
- Complete app functionality without internet
- Service worker caches all app resources
- Photos stored locally in IndexedDB

### Performance
- App shell architecture for instant loading
- Lazy loading of photo thumbnails
- Optimized bundle splitting (vendor, gestures, main)

## Architecture

### Component Structure
```
src/
├── components/          # React components
│   ├── PhotoViewer.tsx  # Full-screen photo viewing
│   ├── PhotoManager.tsx # Photo organization grid
│   ├── PhotoUploader.tsx# File upload interface
│   └── ErrorBoundary.tsx# Error handling
├── hooks/               # Custom React hooks
│   ├── usePhotoWallet.ts# Main app state management
│   ├── useGestures.ts   # Touch gesture handling
│   └── useLocalStorage.ts# Browser storage utilities
├── services/            # Data layer
│   ├── photoStorage.ts  # IndexedDB operations
│   └── fileHandler.ts   # File upload utilities
├── types/               # TypeScript definitions
└── utils/               # Helper functions
```

### State Management
- **React Context API**: Simple state management for app-wide state
- **Custom Hooks**: Encapsulated logic for photos, gestures, and storage
- **IndexedDB**: Persistent storage for photos and metadata

### Gesture System
- **Swipe Navigation**: Horizontal swipes for photo navigation
- **Pinch Zoom**: Pinch gestures for photo zooming
- **Double Tap**: Quick zoom toggle
- **Momentum**: Smooth animations with physics-based spring system

## Browser Support

### Required Features
- **IndexedDB**: For photo storage
- **Service Workers**: For offline functionality
- **File API**: For photo uploads
- **Touch Events**: For gesture support

### Recommended Browsers
- **iOS Safari**: 14+
- **Chrome Android**: 84+
- **Desktop Chrome**: 80+
- **Desktop Safari**: 14+

## Development

### File Structure
```
photo-wallet-pwa/
├── public/
│   ├── icons/           # PWA icons
│   └── manifest.json    # PWA manifest
├── src/                 # Source code
├── specs/               # Requirements documentation
├── vite.config.ts       # Build configuration
└── package.json         # Dependencies
```

### Key Configuration Files
- **vite.config.ts**: Build and PWA configuration
- **tailwind.config.js**: Styling configuration
- **tsconfig.json**: TypeScript configuration

### Performance Considerations
- **Bundle Size**: Target < 1MB total JavaScript
- **Image Optimization**: Efficient blob handling and cleanup
- **Memory Management**: Proper object URL cleanup
- **Gesture Performance**: 60fps animations with hardware acceleration

## Deployment

### Production Build
```bash
npm run build
npm run preview  # Test production build locally
```

### Hosting Requirements
- **HTTPS**: Required for service worker and PWA features
- **Static Hosting**: Works with Vercel, Netlify, GitHub Pages
- **Cache Headers**: Configure proper caching for optimal performance

### PWA Validation
```bash
npm run lighthouse  # Check PWA compliance
```

## Contributing

1. Follow the existing code style and TypeScript patterns
2. Test on multiple browsers and devices
3. Ensure PWA features work correctly
4. Maintain performance benchmarks

## License

This project is for educational and personal use. See requirements document for full specifications.

---

Built with ❤️ using modern web technologies for a native app experience on the web.