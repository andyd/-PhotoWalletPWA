export interface Photo {
  id: string;
  originalName: string;
  blob: Blob;
  order: number;
  importDate: Date;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

export interface PhotoMetadata {
  id: string;
  originalName: string;
  order: number;
  importDate: Date;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

export interface PhotoUploadResult {
  success: Photo[];
  errors: PhotoUploadError[];
}

export interface PhotoUploadError {
  fileName: string;
  message: string;
  type: 'file-type' | 'file-size' | 'storage-limit' | 'processing' | 'unknown';
}

export interface PhotoValidation {
  valid: boolean;
  error?: string;
}

export interface PhotoViewerState {
  currentIndex: number;
  isZoomed: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isFullscreen: boolean;
}

export interface PhotoGestureData {
  scale: number;
  offset: [number, number];
  velocity: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}