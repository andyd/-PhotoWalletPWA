import { validateImageDimensions } from '../utils/validators';
import { APP_CONFIG } from '../utils/constants';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape' | 'square';
  size: number;
  type: string;
}

export class ImageProcessingService {
  // Get image metadata without loading the full image
  static async getImageMetadata(file: File): Promise<ImageMetadata | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;

        let orientation: 'portrait' | 'landscape' | 'square';
        if (aspectRatio > 1.1) {
          orientation = 'landscape';
        } else if (aspectRatio < 0.9) {
          orientation = 'portrait';
        } else {
          orientation = 'square';
        }

        resolve({
          width,
          height,
          aspectRatio,
          orientation,
          size: file.size,
          type: file.type,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  }

  // Resize image while maintaining aspect ratio
  static async resizeImage(
    file: File,
    options: ImageProcessingOptions = {}
  ): Promise<Blob | null> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.9,
      outputFormat = 'jpeg',
      maintainAspectRatio = true,
    } = options;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(null);
          return;
        }

        let { width, height } = img;

        // Calculate new dimensions
        if (maintainAspectRatio) {
          const aspectRatio = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }

          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        } else {
          width = Math.min(width, maxWidth);
          height = Math.min(height, maxHeight);
        }

        // Validate dimensions
        const validation = validateImageDimensions(width, height);
        if (!validation.valid) {
          resolve(null);
          return;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => resolve(blob),
          `image/${outputFormat}`,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  }

  // Create thumbnail for grid view
  static async createThumbnail(file: File, size = 200): Promise<Blob | null> {
    return this.resizeImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.8,
      outputFormat: 'jpeg',
      maintainAspectRatio: true,
    });
  }

  // Optimize image for storage (reduce file size while maintaining quality)
  static async optimizeForStorage(file: File): Promise<Blob | null> {
    const metadata = await this.getImageMetadata(file);
    if (!metadata) return null;

    // Don't optimize if image is already small enough
    if (file.size < 2 * 1024 * 1024) { // Less than 2MB
      return file;
    }

    // Calculate optimal dimensions based on device and storage constraints
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width * devicePixelRatio;
    const screenHeight = window.screen.height * devicePixelRatio;

    const maxDimension = Math.max(screenWidth, screenHeight, 1920);

    return this.resizeImage(file, {
      maxWidth: maxDimension,
      maxHeight: maxDimension,
      quality: 0.85,
      outputFormat: 'jpeg',
      maintainAspectRatio: true,
    });
  }

  // Extract dominant colors from image for UI theming
  static async extractDominantColors(
    file: File,
    colorCount = 3
  ): Promise<string[]> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve([]);
          return;
        }

        // Use small canvas for performance
        const size = 100;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);

        try {
          const imageData = ctx.getImageData(0, 0, size, size);
          const colors = this.analyzeColors(imageData.data, colorCount);
          resolve(colors);
        } catch (error) {
          // Handle CORS or other canvas security errors
          console.warn('Could not extract colors from image:', error);
          resolve([]);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };

      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  // Convert image to different format
  static async convertFormat(
    file: File,
    format: 'jpeg' | 'png' | 'webp',
    quality = 0.9
  ): Promise<Blob | null> {
    return this.resizeImage(file, {
      maxWidth: file.size,
      maxHeight: file.size,
      quality,
      outputFormat: format,
      maintainAspectRatio: true,
    });
  }

  // Private helper methods
  private static analyzeColors(imageData: Uint8ClampedArray, count: number): string[] {
    const colorMap = new Map<string, number>();

    // Sample every 4th pixel for performance
    for (let i = 0; i < imageData.length; i += 16) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const alpha = imageData[i + 3];

      // Skip transparent pixels
      if (alpha < 128) continue;

      // Quantize colors to reduce noise
      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;

      const color = `rgb(${quantizedR}, ${quantizedG}, ${quantizedB})`;
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }

    // Sort by frequency and return top colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([color]) => color);
  }

  // Utility method to check if browser supports WebP
  static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Get optimal output format for the current browser
  static getOptimalFormat(inputType: string): 'jpeg' | 'png' | 'webp' {
    if (this.supportsWebP()) {
      return 'webp';
    }

    if (inputType.includes('png')) {
      return 'png';
    }

    return 'jpeg';
  }
}