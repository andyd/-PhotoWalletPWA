import { useState, useEffect, useCallback, useMemo } from 'react';
import { Photo, PhotoUploadError, AppState } from '../types';
import { photoStorageService } from '../services/photoStorage';
import { validateImageFile } from '../utils/imageProcessing';
import { APP_CONFIG, ERROR_MESSAGES } from '../utils/constants';

export const usePhotoWallet = () => {
  const [state, setState] = useState<AppState>({
    photos: [],
    currentView: 'manager',
    currentPhotoIndex: 0,
    isLoading: false,
    error: null,
    isInstallable: false,
    isOffline: false,
  });

  const loadPhotos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const photos = await photoStorageService.getAllPhotos();
      setState(prev => ({
        ...prev,
        photos: photos.sort((a, b) => a.order - b.order),
        isLoading: false
      }));
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
        setState(prev => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos].sort((a, b) => a.order - b.order),
          isLoading: false,
          error: errors.length > 0 ? errors[0] : null,
          currentView: 'manager',
        }));
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
        currentView: 'manager',
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

  const setCurrentView = useCallback((view: AppState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }));
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
    setCurrentView,
    setCurrentPhotoIndex,
    clearError,
    setInstallable,
    loadPhotos,
  }), [
    addPhotos,
    removePhoto,
    reorderPhotos,
    clearAllPhotos,
    setCurrentView,
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