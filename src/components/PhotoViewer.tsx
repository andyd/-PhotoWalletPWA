import React, { useState, useEffect, useCallback } from 'react';
import { animated } from 'react-spring';
import { Photo } from '../types';
import { useGestures } from '../hooks/useGestures';
import { createObjectURL } from '../utils/imageProcessing';
import { useAppContext } from '../contexts/AppContext';

interface PhotoWithURL extends Photo {
  objectURL: string;
}

export const PhotoViewer: React.FC = () => {
  const { photos, currentPhotoIndex, actions } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(currentPhotoIndex);
  const [photosWithURLs, setPhotosWithURLs] = useState<PhotoWithURL[]>([]);





  useEffect(() => {
    // Create object URLs only when photos change
    const photosWithURLs = photos.map(photo => ({
      ...photo,
      objectURL: createObjectURL(photo.blob),
    }));

    setPhotosWithURLs(photosWithURLs);

    // Don't revoke URLs here - let PhotoManager handle them
    // This prevents conflicts when switching between views
  }, [photos]);

  const currentPhoto = photosWithURLs[currentIndex];

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    setCurrentIndex(newIndex);
    actions.setCurrentPhotoIndex(newIndex);
  }, [currentIndex, photos.length, actions]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    actions.setCurrentPhotoIndex(newIndex);
  }, [currentIndex, photos.length, actions]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      goToNext();
    } else {
      goToPrevious();
    }
  }, [goToNext, goToPrevious]);

  const handleDoubleTap = useCallback(() => {
    // Double tap to exit slideshow
    actions.goToHome();
  }, [actions]);

  const { bind, style, resetTransform } = useGestures({
    onSwipe: handleSwipe,
    onDoubleTap: handleDoubleTap,
  });

  const handlePhotoTap = useCallback(() => {
    // Always advance to next photo on tap
    goToNext();
  }, [goToNext]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        actions.goToHome();
        break;
    }
  }, [goToPrevious, goToNext, actions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setCurrentIndex(currentPhotoIndex);
  }, [currentPhotoIndex]);

  useEffect(() => {
    resetTransform();
  }, [currentIndex, resetTransform]);

  // Show loading state while object URLs are being created
  if (photos.length > 0 && photosWithURLs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading photo...</p>
        </div>
      </div>
    );
  }

  // Show error state if no photos provided
  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No photos to display</p>
          <button
            onClick={() => actions.goToHome()}
            className="mt-4 bg-gray-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show error state if current photo is invalid
  if (!currentPhoto) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Error loading photo</p>
          <button
            onClick={() => actions.goToHome()}
            className="mt-4 bg-gray-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 touch-none select-none">
      {/* Clean slideshow - just the image with tap to advance */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <animated.div
          {...bind}
          style={style}
          className="will-change-transform cursor-pointer"
          onClick={handlePhotoTap}
        >
          <img
            src={currentPhoto.objectURL}
            alt={currentPhoto.originalName}
            className="max-w-full max-h-full object-contain"
            draggable={false}
            onError={(e) => {
              console.error('Image failed to load:', currentPhoto.originalName, e);
            }}
          />
        </animated.div>
      </div>
    </div>
  );
};