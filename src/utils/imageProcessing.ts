import { APP_CONFIG } from './constants';

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!APP_CONFIG.SUPPORTED_FORMATS.includes(file.type as typeof APP_CONFIG.SUPPORTED_FORMATS[number])) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Please select JPEG, PNG, or WebP images.`
    };
  }

  if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${Math.round(APP_CONFIG.MAX_FILE_SIZE / (1024 * 1024))}MB.`
    };
  }

  return { valid: true };
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

export const createImageBlob = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
      resolve(blob);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const createObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

export const generatePhotoId = (): string => {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};