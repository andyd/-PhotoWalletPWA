export interface Photo {
  id: string;
  blob: Blob;
  originalName: string;
  dateAdded: Date;
  order: number;
  width?: number;
  height?: number;
}

export interface PhotoWallet {
  photos: Photo[];
  maxPhotos: number;
  addPhotos(files: FileList): Promise<void>;
  removePhoto(id: string): void;
  reorderPhotos(fromIndex: number, toIndex: number): void;
  clearAllPhotos(): void;
}

export interface PhotoStorageService {
  addPhoto(file: File): Promise<Photo>;
  removePhoto(id: string): Promise<void>;
  getAllPhotos(): Promise<Photo[]>;
  updatePhotoOrder(photos: Photo[]): Promise<void>;
  clearAllPhotos(): Promise<void>;
}

export interface GestureState {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

export interface ViewerState {
  currentIndex: number;
  isZoomed: boolean;
  gestureState: GestureState;
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'double-tap';
  direction?: 'left' | 'right' | 'up' | 'down';
  scale?: number;
  delta?: [number, number];
}

export interface PhotoUploadError {
  type: 'file-type' | 'file-size' | 'storage-limit' | 'storage-quota' | 'unknown';
  message: string;
  fileName?: string;
}

export interface AppState {
  photos: Photo[];
  currentView: 'manager' | 'viewer' | 'uploader' | 'settings';
  currentPhotoIndex: number;
  isLoading: boolean;
  error: PhotoUploadError | null;
  isInstallable: boolean;
  isOffline: boolean;
}

export interface PWAInstallPrompt {
  show(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & {
      prompt(): Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
  }
}