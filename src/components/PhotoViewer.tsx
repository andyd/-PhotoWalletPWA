import React, { useState, useEffect, useCallback } from 'react';
import { animated } from 'react-spring';
import { Photo } from '../types';
import { useGestures } from '../hooks/useGestures';
import { createObjectURL, revokeObjectURL } from '../utils/imageProcessing';

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex?: number;
  onClose: () => void;
  onPhotoChange?: (index: number) => void;
}

interface PhotoWithURL extends Photo {
  objectURL: string;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  initialIndex = 0,
  onClose,
  onPhotoChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [photosWithURLs, setPhotosWithURLs] = useState<PhotoWithURL[]>([]);


  useEffect(() => {
    // Create object URLs only when photos change
    const photosWithURLs = photos.map(photo => ({
      ...photo,
      objectURL: createObjectURL(photo.blob),
    }));

    setPhotosWithURLs(photosWithURLs);

    // Cleanup function to revoke URLs when component unmounts or photos change
    return () => {
      photosWithURLs.forEach(photo => {
        try {
          revokeObjectURL(photo.objectURL);
        } catch (error) {
          console.warn('Error revoking object URL:', error);
        }
      });
    };
  }, [photos]);

  const currentPhoto = photosWithURLs[currentIndex];

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    setCurrentIndex(newIndex);
    onPhotoChange?.(newIndex);
  }, [currentIndex, photos.length, onPhotoChange]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onPhotoChange?.(newIndex);
  }, [currentIndex, photos.length, onPhotoChange]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      goToNext();
    } else {
      goToPrevious();
    }
  }, [goToNext, goToPrevious]);

  const handleDoubleTap = useCallback(() => {
    // Double tap to toggle zoom will be handled by useGestures hook
  }, []);

  const { bind, style, isZoomed, resetTransform } = useGestures({
    onSwipe: handleSwipe,
    onDoubleTap: handleDoubleTap,
  });

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

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
        onClose();
        break;
      case ' ':
        e.preventDefault();
        toggleControls();
        break;
    }
  }, [goToPrevious, goToNext, onClose, toggleControls]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    resetTransform();
  }, [currentIndex, resetTransform]);

  // Show loading state while object URLs are being created
  if (!currentPhoto && photos.length > 0) {
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
  if (!currentPhoto) {
    console.warn('PhotoViewer: No photos provided');
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No photos to display</p>
          <button
            onClick={onClose}
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
      {/* Main Photo */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <animated.div
          {...bind}
          style={style}
          className="will-change-transform cursor-grab active:cursor-grabbing"
          onClick={toggleControls}
        >
          <img
            src={currentPhoto.objectURL}
            alt={currentPhoto.originalName}
            className="max-w-full max-h-full object-contain pointer-events-none"
            draggable={false}
            onError={(e) => {
              console.error('Image failed to load:', currentPhoto.originalName, e);
            }}
          />
        </animated.div>
      </div>

      {/* Controls Overlay */}
      <div
        className={`
          absolute inset-0 pointer-events-none transition-opacity duration-300
          ${showControls ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 safe-area-inset pointer-events-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
              {currentIndex + 1} of {photos.length}
            </div>

            <div className="w-10 h-10"></div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 safe-area-inset pointer-events-auto">
          <div className="text-center">
            <p className="text-white text-sm font-medium">{currentPhoto.originalName}</p>
            {(currentPhoto.width && currentPhoto.height) && (
              <p className="text-gray-300 text-xs mt-1">
                {currentPhoto.width} × {currentPhoto.height}
              </p>
            )}
            {isZoomed && (
              <p className="text-gray-300 text-xs mt-1">
                Double tap to reset zoom
              </p>
            )}
          </div>
        </div>

        {/* Photo Thumbnails */}
        {photos.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 pointer-events-auto">
            <div className="flex justify-center px-4">
              <div className="flex gap-2 bg-black/30 rounded-full p-2 max-w-full overflow-x-auto">
                {photosWithURLs.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      onPhotoChange?.(index);
                    }}
                    className={`
                      w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0
                      ${index === currentIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-70 hover:opacity-100'
                      }
                    `}
                  >
                    <img
                      src={photo.objectURL}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className={`
            bg-black/50 text-white text-sm rounded-lg px-4 py-2 transition-opacity duration-1000
            ${showControls ? 'opacity-0' : 'opacity-100'}
          `}
        >
          Swipe to navigate • Double tap to zoom • Tap to show controls
        </div>
      </div>
    </div>
  );
};