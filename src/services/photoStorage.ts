import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Photo, PhotoStorageService } from '../types';
import { APP_CONFIG } from '../utils/constants';
import { generatePhotoId, getImageDimensions, createImageBlob } from '../utils/imageProcessing';

interface PhotoWalletDB extends DBSchema {
  photos: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      originalName: string;
      dateAdded: string;
      order: number;
      width?: number;
      height?: number;
    };
    indexes: {
      'by-order': number;
      'by-date': string;
    };
  };
}

class PhotoStorageServiceImpl implements PhotoStorageService {
  private db: IDBPDatabase<PhotoWalletDB> | null = null;

  private async getDB(): Promise<IDBPDatabase<PhotoWalletDB>> {
    if (!this.db) {
      this.db = await openDB<PhotoWalletDB>(APP_CONFIG.DB_NAME, APP_CONFIG.DB_VERSION, {
        upgrade(db) {
          const store = db.createObjectStore('photos', { keyPath: 'id' });
          store.createIndex('by-order', 'order');
          store.createIndex('by-date', 'dateAdded');
        },
      });
    }
    return this.db;
  }

  async addPhoto(file: File): Promise<Photo> {
    const db = await this.getDB();

    try {
      const [blob, dimensions] = await Promise.all([
        createImageBlob(file),
        getImageDimensions(file).catch(() => ({ width: 0, height: 0 }))
      ]);

      const allPhotos = await this.getAllPhotos();
      const maxOrder = allPhotos.length > 0 ? Math.max(...allPhotos.map(p => p.order)) : -1;

      const photo: Photo = {
        id: generatePhotoId(),
        blob,
        originalName: file.name,
        dateAdded: new Date(),
        order: maxOrder + 1,
        width: dimensions.width,
        height: dimensions.height,
      };

      const dbPhoto = {
        ...photo,
        dateAdded: photo.dateAdded.toISOString(),
      };

      await db.add('photos', dbPhoto);
      return photo;
    } catch (error) {
      throw new Error(`Failed to add photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removePhoto(id: string): Promise<void> {
    const db = await this.getDB();

    try {
      await db.delete('photos', id);
    } catch (error) {
      throw new Error(`Failed to remove photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPhotos(): Promise<Photo[]> {
    const db = await this.getDB();

    try {
      const dbPhotos = await db.getAllFromIndex('photos', 'by-order');
      console.log('getAllPhotos: Found', dbPhotos.length, 'photos in database');

      return dbPhotos.map(dbPhoto => ({
        ...dbPhoto,
        dateAdded: new Date(dbPhoto.dateAdded),
      }));
    } catch (error) {
      console.error('getAllPhotos error:', error);
      throw new Error(`Failed to get photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhotoOrder(photos: Photo[]): Promise<void> {
    const db = await this.getDB();

    try {
      const tx = db.transaction('photos', 'readwrite');

      for (const photo of photos) {
        const dbPhoto = {
          ...photo,
          dateAdded: photo.dateAdded.toISOString(),
        };
        await tx.store.put(dbPhoto);
      }

      await tx.done;
    } catch (error) {
      throw new Error(`Failed to update photo order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearAllPhotos(): Promise<void> {
    const db = await this.getDB();

    try {
      await db.clear('photos');
    } catch (error) {
      throw new Error(`Failed to clear photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStorageInfo(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { used: 0, quota: 0 };
  }
}

export const photoStorageService = new PhotoStorageServiceImpl();