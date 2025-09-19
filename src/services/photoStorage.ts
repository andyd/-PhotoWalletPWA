import Dexie, { Table } from 'dexie';
import type {
  StoredPhoto,
  StoredSettings,
  Photo,
  PhotoUploadResult,
  PhotoUploadError,
  StorageQuota,
  StorageStats,
  StorageOperationResult,
} from '../types';
import { validateImageFile, validatePhotoCount } from '../utils/validators';
import { generateId } from '../utils/helpers';
import { APP_CONFIG, DEFAULT_SETTINGS, ERROR_MESSAGES } from '../utils/constants';

class PhotoWalletDatabase extends Dexie {
  photos!: Table<StoredPhoto, string>;
  settings!: Table<StoredSettings, string>;

  constructor() {
    super('PhotoWalletDB');

    this.version(1).stores({
      photos: 'id, originalName, order, importDate, size, type',
      settings: 'id',
    });

    // Add hooks for data validation
    this.photos.hook('creating', (_primKey, obj) => {
      obj.importDate = new Date();
      if (!obj.id) {
        obj.id = generateId();
      }
    });

    this.photos.hook('updating', (modifications) => {
      if ('order' in modifications && typeof modifications.order === 'number') {
        // Ensure order is a valid number
        modifications.order = Math.max(0, Math.floor(modifications.order));
      }
    });
  }
}

class PhotoStorageService {
  private db: PhotoWalletDatabase;

  constructor() {
    this.db = new PhotoWalletDatabase();
    this.initializeSettings();
  }

  // Initialize default settings if they don't exist
  private async initializeSettings(): Promise<void> {
    try {
      const existing = await this.db.settings.get('app-settings');
      if (!existing) {
        await this.db.settings.put({
          id: 'app-settings',
          ...DEFAULT_SETTINGS,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to initialize settings:', error);
    }
  }

  // Photo operations
  async getAllPhotos(): Promise<Photo[]> {
    try {
      const photos = await this.db.photos.orderBy('order').toArray();
      return photos.map(this.mapStoredToPhoto);
    } catch (error) {
      console.error('Failed to get photos:', error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async getPhotoById(id: string): Promise<Photo | null> {
    try {
      const photo = await this.db.photos.get(id);
      return photo ? this.mapStoredToPhoto(photo) : null;
    } catch (error) {
      console.error('Failed to get photo:', error);
      return null;
    }
  }

  async addPhoto(file: File): Promise<Photo> {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check photo count limit
    const currentCount = await this.getPhotoCount();
    const countValidation = validatePhotoCount(currentCount, 1);
    if (!countValidation.valid) {
      throw new Error(countValidation.error);
    }

    try {
      // Get dimensions if possible
      const dimensions = await this.getImageDimensions(file);

      // Create photo object
      const photo: StoredPhoto = {
        id: generateId(),
        originalName: file.name,
        blob: file,
        order: currentCount,
        importDate: new Date(),
        size: file.size,
        type: file.type,
        width: dimensions?.width,
        height: dimensions?.height,
      };

      await this.db.photos.add(photo);
      return this.mapStoredToPhoto(photo);
    } catch (error) {
      console.error('Failed to add photo:', error);
      throw new Error(ERROR_MESSAGES.IMPORT_ERROR);
    }
  }

  async addPhotos(files: File[]): Promise<PhotoUploadResult> {
    const result: PhotoUploadResult = {
      success: [],
      errors: [],
    };

    const currentCount = await this.getPhotoCount();
    const remainingSlots = APP_CONFIG.MAX_PHOTOS - currentCount;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if we've reached the limit
      if (result.success.length >= remainingSlots) {
        result.errors.push({
          fileName: file.name,
          message: ERROR_MESSAGES.STORAGE_LIMIT_REACHED,
          type: 'storage-limit',
        });
        continue;
      }

      try {
        const photo = await this.addPhoto(file);
        result.success.push(photo);
      } catch (error) {
        result.errors.push({
          fileName: file.name,
          message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
          type: 'processing',
        });
      }
    }

    return result;
  }

  async removePhoto(id: string): Promise<boolean> {
    try {
      const count = await this.db.photos.where('id').equals(id).delete();
      if (count > 0) {
        // Reorder remaining photos
        await this.reorderPhotos();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove photo:', error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async updatePhotoOrder(photos: Photo[]): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.photos, async () => {
        for (let i = 0; i < photos.length; i++) {
          await this.db.photos.update(photos[i].id, { order: i });
        }
      });
    } catch (error) {
      console.error('Failed to update photo order:', error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async clearAllPhotos(): Promise<void> {
    try {
      await this.db.photos.clear();
    } catch (error) {
      console.error('Failed to clear photos:', error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  // Settings operations
  async getSettings(): Promise<StoredSettings> {
    try {
      const settings = await this.db.settings.get('app-settings');
      return settings || {
        id: 'app-settings',
        ...DEFAULT_SETTINGS,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        id: 'app-settings',
        ...DEFAULT_SETTINGS,
        lastUpdated: new Date(),
      };
    }
  }

  async updateSettings(settings: Partial<StoredSettings>): Promise<void> {
    try {
      await this.db.settings.update('app-settings', {
        ...settings,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  // Storage info and statistics
  async getStorageStats(): Promise<StorageStats> {
    try {
      const photos = await this.db.photos.toArray();
      const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);

      return {
        photoCount: photos.length,
        totalSize,
        averageSize: photos.length > 0 ? totalSize / photos.length : 0,
        lastCleanup: new Date(),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async getStorageQuota(): Promise<StorageQuota> {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const total = available;

      return {
        used,
        available: available - used,
        total,
        percentage: total > 0 ? used / total : 0,
      };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return {
        used: 0,
        available: 0,
        total: 0,
        percentage: 0,
      };
    }
  }

  // Utility methods
  private async getPhotoCount(): Promise<number> {
    try {
      return await this.db.photos.count();
    } catch (error) {
      console.error('Failed to get photo count:', error);
      return 0;
    }
  }

  private async reorderPhotos(): Promise<void> {
    try {
      const photos = await this.db.photos.orderBy('order').toArray();
      await this.db.transaction('rw', this.db.photos, async () => {
        for (let i = 0; i < photos.length; i++) {
          await this.db.photos.update(photos[i].id, { order: i });
        }
      });
    } catch (error) {
      console.error('Failed to reorder photos:', error);
    }
  }

  private mapStoredToPhoto(stored: StoredPhoto): Photo {
    return {
      id: stored.id,
      originalName: stored.originalName,
      blob: stored.blob,
      order: stored.order,
      importDate: stored.importDate,
      size: stored.size,
      type: stored.type,
      width: stored.width,
      height: stored.height,
    };
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  }

  // Database management
  async exportData(): Promise<StorageOperationResult<string>> {
    try {
      const photos = await this.db.photos.toArray();
      const settings = await this.getSettings();

      const exportData = {
        version: '2.0.0',
        exportDate: new Date(),
        photos,
        settings,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return {
        success: true,
        data: jsonString,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.EXPORT_ERROR,
        timestamp: new Date(),
      };
    }
  }
}

// Export singleton instance
export const photoStorageService = new PhotoStorageService();