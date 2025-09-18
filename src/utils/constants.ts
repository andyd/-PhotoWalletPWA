export const APP_CONFIG = {
  MAX_PHOTOS: 50,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'] as const,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  DB_NAME: 'PhotoWalletDB',
  DB_VERSION: 1,
  STORE_NAME: 'photos',
} as const;

export const GESTURE_CONFIG = {
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 0.3,
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 5,
  DOUBLE_TAP_THRESHOLD: 300,
  MOMENTUM_DAMPING: 0.95,
  SPRING_CONFIG: {
    tension: 300,
    friction: 30,
  },
} as const;

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  TRANSITION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  SAFE_AREA_PADDING: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
} as const;

export const ERROR_MESSAGES = {
  FILE_TYPE_NOT_SUPPORTED: 'File type not supported. Please select JPEG, PNG, or WebP images.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 50MB.',
  STORAGE_LIMIT_REACHED: 'Cannot add more photos. Maximum of 50 photos allowed.',
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded. Please remove some photos.',
  PHOTO_LOAD_FAILED: 'Failed to load photo. Please try again.',
  INDEXEDDB_NOT_SUPPORTED: 'Your browser does not support offline storage.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;