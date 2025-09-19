import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { photoStorageService } from '../services/photoStorage';
import { FileHandlerService } from '../services/fileHandler';
import type { Photo, PhotoUploadResult, AppError } from '../types';
import { ERROR_MESSAGES } from '../utils/constants';

interface PhotoState {
  // State
  photos: Photo[];
  selectedPhotoId: string | null;
  currentIndex: number;
  isLoading: boolean;
  error: AppError | null;
  uploadProgress: number;

  // Actions
  loadPhotos: () => Promise<void>;
  addPhotos: (files: File[]) => Promise<PhotoUploadResult>;
  removePhoto: (id: string) => Promise<void>;
  clearAllPhotos: () => Promise<void>;
  reorderPhotos: (fromIndex: number, toIndex: number) => Promise<void>;
  selectPhoto: (id: string) => void;
  setCurrentIndex: (index: number) => void;
  clearError: () => void;
  setError: (error: AppError) => void;

  // Computed getters
  getCurrentPhoto: () => Photo | null;
  getPhotoById: (id: string) => Photo | undefined;
  hasPhotos: () => boolean;
  canAddMorePhotos: () => boolean;
}

export const usePhotoStore = create<PhotoState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      photos: [],
      selectedPhotoId: null,
      currentIndex: 0,
      isLoading: false,
      error: null,
      uploadProgress: 0,

      // Actions
      loadPhotos: async () => {
        try {
          set({ isLoading: true, error: null });

          const photos = await photoStorageService.getAllPhotos();

          set({
            photos,
            isLoading: false,
            currentIndex: 0,
            selectedPhotoId: photos.length > 0 ? photos[0].id : null,
          });
        } catch (error) {
          const appError: AppError = {
            message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
            type: 'storage',
            timestamp: new Date(),
            recoverable: true,
          };

          set({
            isLoading: false,
            error: appError,
          });
        }
      },

      addPhotos: async (files: File[]) => {
        try {
          set({ isLoading: true, error: null, uploadProgress: 0 });

          // Validate files first
          const { validFiles, invalidFiles } = FileHandlerService.processFiles(files);

          if (validFiles.length === 0) {
            const appError: AppError = {
              message: invalidFiles.length > 0
                ? invalidFiles[0].error
                : 'No valid image files found',
              type: 'validation',
              timestamp: new Date(),
              recoverable: true,
            };

            set({ isLoading: false, error: appError });
            return { success: [], errors: [] };
          }

          // Upload files with progress tracking
          const result = await photoStorageService.addPhotos(validFiles);

          // Update state with new photos
          if (result.success.length > 0) {
            const currentPhotos = get().photos;
            const updatedPhotos = [...currentPhotos, ...result.success]
              .sort((a, b) => a.order - b.order);

            set({
              photos: updatedPhotos,
              selectedPhotoId: result.success[0].id,
              currentIndex: updatedPhotos.findIndex(p => p.id === result.success[0].id),
              isLoading: false,
              uploadProgress: 100,
            });

            // Reset progress after a delay
            setTimeout(() => set({ uploadProgress: 0 }), 2000);
          } else {
            set({ isLoading: false });
          }

          // Handle errors if any
          if (result.errors.length > 0) {
            const appError: AppError = {
              message: result.errors[0].message,
              type: 'validation',
              timestamp: new Date(),
              recoverable: true,
            };

            set({ error: appError });
          }

          return result;
        } catch (error) {
          const appError: AppError = {
            message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
            type: 'storage',
            timestamp: new Date(),
            recoverable: true,
          };

          set({
            isLoading: false,
            error: appError,
            uploadProgress: 0,
          });

          return { success: [], errors: [] };
        }
      },

      removePhoto: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const success = await photoStorageService.removePhoto(id);

          if (success) {
            const currentPhotos = get().photos;
            const updatedPhotos = currentPhotos.filter(photo => photo.id !== id);
            const currentIndex = get().currentIndex;

            // Adjust current index if necessary
            let newIndex = currentIndex;
            let newSelectedId: string | null = null;

            if (updatedPhotos.length > 0) {
              if (currentIndex >= updatedPhotos.length) {
                newIndex = updatedPhotos.length - 1;
              }
              newSelectedId = updatedPhotos[newIndex]?.id || null;
            } else {
              newIndex = 0;
            }

            set({
              photos: updatedPhotos,
              currentIndex: newIndex,
              selectedPhotoId: newSelectedId,
              isLoading: false,
            });
          } else {
            throw new Error('Failed to remove photo');
          }
        } catch (error) {
          const appError: AppError = {
            message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
            type: 'storage',
            timestamp: new Date(),
            recoverable: true,
          };

          set({
            isLoading: false,
            error: appError,
          });
        }
      },

      clearAllPhotos: async () => {
        try {
          set({ isLoading: true, error: null });

          await photoStorageService.clearAllPhotos();

          set({
            photos: [],
            selectedPhotoId: null,
            currentIndex: 0,
            isLoading: false,
          });
        } catch (error) {
          const appError: AppError = {
            message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
            type: 'storage',
            timestamp: new Date(),
            recoverable: true,
          };

          set({
            isLoading: false,
            error: appError,
          });
        }
      },

      reorderPhotos: async (fromIndex: number, toIndex: number) => {
        try {
          const currentPhotos = get().photos;

          // Optimistically update UI
          const reorderedPhotos = [...currentPhotos];
          const [movedPhoto] = reorderedPhotos.splice(fromIndex, 1);
          reorderedPhotos.splice(toIndex, 0, movedPhoto);

          // Update order property
          const updatedPhotos = reorderedPhotos.map((photo, index) => ({
            ...photo,
            order: index,
          }));

          set({ photos: updatedPhotos });

          // Persist to storage
          await photoStorageService.updatePhotoOrder(updatedPhotos);

          // Update current index if the current photo was moved
          const currentPhoto = get().getCurrentPhoto();
          if (currentPhoto) {
            const newIndex = updatedPhotos.findIndex(p => p.id === currentPhoto.id);
            set({ currentIndex: newIndex });
          }
        } catch (error) {
          // Revert on error
          await get().loadPhotos();

          const appError: AppError = {
            message: 'Failed to reorder photos. Changes reverted.',
            type: 'storage',
            timestamp: new Date(),
            recoverable: true,
          };

          set({ error: appError });
        }
      },

      selectPhoto: (id: string) => {
        const photos = get().photos;
        const index = photos.findIndex(photo => photo.id === id);

        if (index !== -1) {
          set({
            selectedPhotoId: id,
            currentIndex: index,
          });
        }
      },

      setCurrentIndex: (index: number) => {
        const photos = get().photos;

        if (index >= 0 && index < photos.length) {
          set({
            currentIndex: index,
            selectedPhotoId: photos[index].id,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setError: (error: AppError) => {
        set({ error });
      },

      // Computed getters
      getCurrentPhoto: () => {
        const { photos, currentIndex } = get();
        return photos[currentIndex] || null;
      },

      getPhotoById: (id: string) => {
        const { photos } = get();
        return photos.find(photo => photo.id === id);
      },

      hasPhotos: () => {
        return get().photos.length > 0;
      },

      canAddMorePhotos: () => {
        const { photos } = get();
        return photos.length < 10; // APP_CONFIG.MAX_PHOTOS
      },
    })),
    {
      name: 'photo-store',
      partialize: (state: any) => ({
        // Only persist non-function properties
        photos: state.photos,
        selectedPhotoId: state.selectedPhotoId,
        currentIndex: state.currentIndex,
      }),
    }
  )
);