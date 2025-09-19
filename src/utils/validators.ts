import {
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_FILE_EXTENSIONS,
  APP_CONFIG,
  ERROR_MESSAGES,
} from './constants';
import type { PhotoValidation } from '../types';

export const validateImageFile = (file: File): PhotoValidation => {
  // Check file size
  if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE,
    };
  }

  // Check file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.UNSUPPORTED_FORMAT,
    };
  }

  // Check file extension as backup
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!SUPPORTED_FILE_EXTENSIONS.includes(extension as any)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.UNSUPPORTED_FORMAT,
    };
  }

  return { valid: true };
};

export const validatePhotoCount = (
  currentCount: number,
  newPhotosCount: number
): PhotoValidation => {
  const totalCount = currentCount + newPhotosCount;

  if (totalCount > APP_CONFIG.MAX_PHOTOS) {
    const allowedCount = APP_CONFIG.MAX_PHOTOS - currentCount;
    return {
      valid: false,
      error: `Can only add ${allowedCount} more photo${
        allowedCount !== 1 ? 's' : ''
      }. Maximum ${APP_CONFIG.MAX_PHOTOS} photos allowed.`,
    };
  }

  return { valid: true };
};

export const validateStorageQuota = (
  usedBytes: number,
  additionalBytes: number,
  quotaBytes: number
): PhotoValidation => {
  const totalBytes = usedBytes + additionalBytes;
  const percentage = totalBytes / quotaBytes;

  if (percentage > 1) {
    return {
      valid: false,
      error: ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED,
    };
  }

  if (percentage > APP_CONFIG.STORAGE_QUOTA_WARNING) {
    return {
      valid: true,
      error: `Storage ${Math.round(percentage * 100)}% full. Consider removing some photos.`,
    };
  }

  return { valid: true };
};

export const validatePhotoOrder = (
  order: number,
  maxOrder: number
): PhotoValidation => {
  if (order < 0 || order > maxOrder) {
    return {
      valid: false,
      error: 'Invalid photo order',
    };
  }

  return { valid: true };
};

export const validateImageDimensions = (
  width: number,
  height: number
): PhotoValidation => {
  const minDimension = 50;
  const maxDimension = 8192;

  if (width < minDimension || height < minDimension) {
    return {
      valid: false,
      error: `Image too small. Minimum ${minDimension}x${minDimension} pixels required.`,
    };
  }

  if (width > maxDimension || height > maxDimension) {
    return {
      valid: false,
      error: `Image too large. Maximum ${maxDimension}x${maxDimension} pixels allowed.`,
    };
  }

  return { valid: true };
};

export const validateZoomLevel = (zoomLevel: number): PhotoValidation => {
  if (zoomLevel < APP_CONFIG.MIN_ZOOM_LEVEL || zoomLevel > APP_CONFIG.MAX_ZOOM_LEVEL) {
    return {
      valid: false,
      error: `Zoom level must be between ${APP_CONFIG.MIN_ZOOM_LEVEL} and ${APP_CONFIG.MAX_ZOOM_LEVEL}`,
    };
  }

  return { valid: true };
};

export const isValidId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0 && !id.includes('/') && !id.includes('\\');
};

export const isValidFileName = (name: string): boolean => {
  const invalidChars = /[<>:"/\\|?*]/;
  return typeof name === 'string' && name.length > 0 && !invalidChars.test(name);
};

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};