import { useState, useEffect, useCallback, useMemo } from 'react';
import { Photo, PhotoUploadError, AppState } from '../types';
import { photoStorageService } from '../services/photoStorage';
import { validateImageFile } from '../utils/imageProcessing';
import { APP_CONFIG, ERROR_MESSAGES } from '../utils/constants';

export const usePhotoWallet = () => {
  const [state, setState] = useState<AppState>({
    photos: [],
    currentView: 'home', // Start with home, will be corrected after loading photos
    currentPhotoIndex: 0,
    isLoading: true, // Start with loading true since we need to load photos
    error: null,
    isInstallable: false,
    isOffline: false,
  });

  const loadPhotos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const photos = await photoStorageService.getAllPhotos();
      const sortedPhotos = photos.sort((a, b) => a.order - b.order);
      
      setState(prev => ({
        ...prev,
        photos: sortedPhotos,
        currentView: sortedPhotos.length > 0 ? 'home' : 'setup',
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentView: 'setup', // Default to setup on error
        error: {
          type: 'unknown',
          message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        },
      }));
    }
  }, []);

  const addPhotos = useCallback(async (files: File[]) => {
    if (state.photos.length >= APP_CONFIG.MAX_PHOTOS) {
      setState(prev => ({
        ...prev,
        error: {
          type: 'storage-limit',
          message: ERROR_MESSAGES.STORAGE_LIMIT_REACHED,
        },
      }));
      return;
    }

    const errors: PhotoUploadError[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push({
          type: 'file-type',
          message: validation.error!,
          fileName: file.name,
        });
      }
    });

    if (state.photos.length + validFiles.length > APP_CONFIG.MAX_PHOTOS) {
      const allowedCount = APP_CONFIG.MAX_PHOTOS - state.photos.length;
      errors.push({
        type: 'storage-limit',
        message: `Can only add ${allowedCount} more photo${allowedCount !== 1 ? 's' : ''}.`,
      });
      validFiles.splice(allowedCount);
    }

    if (validFiles.length === 0) {
      setState(prev => ({ ...prev, error: errors[0] || null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newPhotos: Photo[] = [];

      for (const file of validFiles) {
        try {
          const photo = await photoStorageService.addPhoto(file);
          newPhotos.push(photo);
        } catch (error) {
          errors.push({
            type: 'unknown',
            message: `Failed to add ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            fileName: file.name,
          });
        }
      }

      if (newPhotos.length > 0) {
        setState(prev => {
          const newPhotosArray = [...prev.photos, ...newPhotos].sort((a, b) => a.order - b.order);
          console.log('usePhotoWallet: Updating state with new photos:', {
            previousCount: prev.photos.length,
            newCount: newPhotosArray.length,
            newPhotos: newPhotos.map(p => ({ id: p.id, name: p.originalName, hasBlob: !!p.blob }))
          });
          
          // Always go to home after adding photos, regardless of current view
          return {
            ...prev,
            photos: newPhotosArray,
            isLoading: false,
            error: errors.length > 0 ? errors[0] : null,
            currentView: 'home',
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errors[0] || {
            type: 'unknown',
            message: ERROR_MESSAGES.UNKNOWN_ERROR,
          },
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          type: 'unknown',
          message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        },
      }));
    }
  }, [state.photos.length]);

  const removePhoto = useCallback(async (id: string) => {
    try {
      await photoStorageService.removePhoto(id);
      setState(prev => ({
        ...prev,
        photos: prev.photos.filter(photo => photo.id !== id),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: {
          type: 'unknown',
          message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        },
      }));
    }
  }, []);

  const reorderPhotos = useCallback(async (fromIndex: number, toIndex: number) => {
    const newPhotos = [...state.photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);

    const reorderedPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      order: index,
    }));

    setState(prev => ({ ...prev, photos: reorderedPhotos }));

    try {
      await photoStorageService.updatePhotoOrder(reorderedPhotos);
    } catch (error) {
      await loadPhotos();
      setState(prev => ({
        ...prev,
        error: {
          type: 'unknown',
          message: 'Failed to save new photo order. Reloading...',
        },
      }));
    }
  }, [state.photos, loadPhotos]);

  const clearAllPhotos = useCallback(async () => {
    try {
      await photoStorageService.clearAllPhotos();
      setState(prev => ({
        ...prev,
        photos: [],
        currentView: 'setup',
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: {
          type: 'unknown',
          message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        },
      }));
    }
  }, []);

  // Simplified navigation actions
  const goToSetup = useCallback(() => {
    setState(prev => ({ ...prev, currentView: 'setup' }));
  }, []);

  const goToHome = useCallback(() => {
    setState(prev => ({ ...prev, currentView: 'home' }));
  }, []);


  const goToSlide = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentView: 'slide', currentPhotoIndex: index }));
  }, []);

  const setCurrentPhotoIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentPhotoIndex: index }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setInstallable = useCallback((isInstallable: boolean) => {
    setState(prev => ({ ...prev, isInstallable }));
  }, []);

  const setOffline = useCallback((isOffline: boolean) => {
    setState(prev => ({ ...prev, isOffline }));
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Auto-determine view based on photos (only after loading is complete)
  // This handles cases where photos are cleared after initial load
  useEffect(() => {
    if (!state.isLoading && state.photos.length === 0 && state.currentView !== 'setup') {
      setState(prev => ({ ...prev, currentView: 'setup' }));
    }
  }, [state.photos.length, state.currentView, state.isLoading]);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  const actions = useMemo(() => ({
    addPhotos,
    removePhoto,
    reorderPhotos,
    clearAllPhotos,
    goToSetup,
    goToHome,
    goToSlide,
    setCurrentPhotoIndex,
    clearError,
    setInstallable,
    loadPhotos,
  }), [
    addPhotos,
    removePhoto,
    reorderPhotos,
    clearAllPhotos,
    goToSetup,
    goToHome,
    goToSlide,
    setCurrentPhotoIndex,
    clearError,
    setInstallable,
    loadPhotos,
  ]);

  return {
    ...state,
    actions,
  };
};