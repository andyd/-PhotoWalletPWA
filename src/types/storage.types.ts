export interface StoredPhoto {
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

export interface StoredSettings {
  id: 'app-settings';
  theme: 'dark' | 'light' | 'auto';
  gesturesSensitivity: 'low' | 'medium' | 'high';
  zoomBehavior: 'smooth' | 'instant';
  autoRotate: boolean;
  showTutorial: boolean;
  maxZoomLevel: number;
  lastUpdated: Date;
}

export interface StorageQuota {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export interface StorageStats {
  photoCount: number;
  totalSize: number;
  averageSize: number;
  lastCleanup: Date;
}

export interface DatabaseVersion {
  version: number;
  description: string;
  migrationDate: Date;
}

export interface ExportData {
  version: string;
  exportDate: Date;
  photos: StoredPhoto[];
  settings: StoredSettings;
}

export interface ImportResult {
  importedPhotos: number;
  skippedPhotos: number;
  errors: string[];
  settingsImported: boolean;
}

export interface StorageOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}