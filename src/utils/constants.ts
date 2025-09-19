export const APP_CONFIG = {
  MAX_PHOTOS: 10,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_ZOOM_LEVEL: 3,
  MIN_ZOOM_LEVEL: 0.5,
  GESTURE_THRESHOLD: 10,
  ANIMATION_DURATION: 300,
  AUTO_HIDE_CONTROLS_DELAY: 3000,
  STORAGE_QUOTA_WARNING: 0.8, // 80%
} as const;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const SUPPORTED_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
] as const;

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 50MB limit',
  UNSUPPORTED_FORMAT: 'Unsupported image format',
  STORAGE_LIMIT_REACHED: 'Maximum of 10 photos allowed',
  STORAGE_QUOTA_EXCEEDED: 'Device storage limit reached',
  NETWORK_ERROR: 'Network connection required',
  PERMISSION_DENIED: 'File access permission denied',
  PROCESSING_ERROR: 'Error processing image',
  UNKNOWN_ERROR: 'An unexpected error occurred',
  DATABASE_ERROR: 'Database operation failed',
  IMPORT_ERROR: 'Failed to import photo',
  EXPORT_ERROR: 'Failed to export data',
} as const;

export const GESTURE_CONFIG = {
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 0.3,
  PINCH_THRESHOLD: 0.1,
  DOUBLE_TAP_DELAY: 300,
  LONG_PRESS_DELAY: 500,
  MOMENTUM_DAMPING: 0.95,
} as const;

export const PWA_CONFIG = {
  THEME_COLOR: '#000000',
  BACKGROUND_COLOR: '#000000',
  DISPLAY: 'standalone',
  ORIENTATION: 'portrait',
  SCOPE: '/',
  START_URL: '/',
} as const;

export const ANIMATION_CONFIG = {
  SPRING: {
    tension: 300,
    friction: 30,
  },
  EASING: {
    ease: [0.4, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.6, 1],
    easeOut: [0, 0, 0.2, 1],
  },
  DURATION: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

export const STORAGE_KEYS = {
  PHOTOS: 'photos',
  SETTINGS: 'settings',
  METADATA: 'metadata',
  CACHE: 'cache',
} as const;

export const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  gesturesSensitivity: 'medium' as const,
  zoomBehavior: 'smooth' as const,
  autoRotate: false,
  showTutorial: true,
  maxZoomLevel: APP_CONFIG.MAX_ZOOM_LEVEL,
} as const;