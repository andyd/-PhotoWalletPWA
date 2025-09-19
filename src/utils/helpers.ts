import { APP_CONFIG } from './constants';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const distance = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isValidIndex = (index: number, arrayLength: number): boolean => {
  return index >= 0 && index < arrayLength;
};

export const getNextIndex = (
  currentIndex: number,
  arrayLength: number,
  loop = true
): number => {
  if (arrayLength === 0) return 0;

  const nextIndex = currentIndex + 1;

  if (nextIndex >= arrayLength) {
    return loop ? 0 : currentIndex;
  }

  return nextIndex;
};

export const getPreviousIndex = (
  currentIndex: number,
  arrayLength: number,
  loop = true
): number => {
  if (arrayLength === 0) return 0;

  const prevIndex = currentIndex - 1;

  if (prevIndex < 0) {
    return loop ? arrayLength - 1 : currentIndex;
  }

  return prevIndex;
};

export const createObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  revokeObjectURL(url);
};

export const sharePhoto = async (
  blob: Blob,
  filename: string
): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  try {
    const file = new File([blob], filename, { type: blob.type });
    await navigator.share({
      files: [file],
      title: 'Photo from Photo Wallet',
    });
    return true;
  } catch (error) {
    console.error('Error sharing photo:', error);
    return false;
  }
};

export const getDeviceInfo = () => {
  return {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    supportsWebP: (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })(),
    supportsTouch: 'ontouchstart' in window,
    pixelRatio: window.devicePixelRatio || 1,
    orientation: window.screen.orientation?.type || 'portrait-primary',
  };
};