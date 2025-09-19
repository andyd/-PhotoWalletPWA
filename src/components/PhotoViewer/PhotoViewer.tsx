import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Share, Grid } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { useUIStore } from '../../stores/uiStore';
import { createObjectURL, revokeObjectURL, getNextIndex, getPreviousIndex } from '../../utils/helpers';
import { sharePhoto } from '../../utils/helpers';
import { useToast } from '../UI/Toast';

export const PhotoViewer: React.FC = () => {
  const {
    photos,
    currentIndex,
    setCurrentIndex,
    getCurrentPhoto,
  } = usePhotoStore();

  const { setCurrentView } = useUIStore();
  const toast = useToast();

  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [showControls, setShowControls] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentPhoto = getCurrentPhoto();

  // Generate image URLs
  useEffect(() => {
    const urls = new Map<string, string>();

    photos.forEach((photo) => {
      urls.set(photo.id, createObjectURL(photo.blob));
    });

    setImageUrls(urls);

    return () => {
      urls.forEach((url) => revokeObjectURL(url));
    };
  }, [photos]);

  // Navigation functions
  const goToNext = useCallback(() => {
    const nextIndex = getNextIndex(currentIndex, photos.length);
    setCurrentIndex(nextIndex);
  }, [currentIndex, photos.length, setCurrentIndex]);

  const goToPrevious = useCallback(() => {
    const prevIndex = getPreviousIndex(currentIndex, photos.length);
    setCurrentIndex(prevIndex);
  }, [currentIndex, photos.length, setCurrentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setCurrentView('manager');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, setCurrentView]);

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Handle pan gestures for navigation
  const handlePanEnd = useCallback((_event: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = Math.abs(info.velocity.x);

    if (Math.abs(info.offset.x) > threshold || velocity > 500) {
      if (info.offset.x > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
  }, [goToPrevious, goToNext]);

  // Handle double tap to zoom
  const handleDoubleTap = useCallback(() => {
    setIsZoomed(!isZoomed);
  }, [isZoomed]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!currentPhoto) return;

    try {
      const success = await sharePhoto(currentPhoto.blob, currentPhoto.originalName);
      if (!success) {
        toast.info('Share not supported on this device');
      }
    } catch (error) {
      toast.error('Failed to share photo');
    }
  }, [currentPhoto, toast]);

  // Show controls on interaction
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
  }, []);

  if (!currentPhoto || photos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">No photo to display</p>
          <button
            onClick={() => setCurrentView('manager')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = imageUrls.get(currentPhoto.id);

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={showControlsTemporarily}
    >
      {/* Image container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: isZoomed ? 1.5 : 1,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            drag={isZoomed ? true : 'x'}
            dragConstraints={isZoomed ? { left: -200, right: 200, top: -200, bottom: 200 } : { left: 0, right: 0 }}
            dragElastic={0.1}
            onPanEnd={!isZoomed ? handlePanEnd : undefined}
            onDoubleClick={handleDoubleTap}
            className="relative w-full h-full flex items-center justify-center cursor-pointer"
            style={{ touchAction: 'none' }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={currentPhoto.originalName}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Top controls */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 safe-area-top"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentView('manager')}
                  className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm font-medium">
                    {currentIndex + 1} of {photos.length}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                  >
                    <Share className="w-5 h-5 text-white" />
                  </button>

                  <button
                    onClick={() => setCurrentView('manager')}
                    className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                  >
                    <Grid className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Navigation controls */}
            {photos.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>
              </>
            )}

            {/* Bottom info */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 safe-area-bottom"
            >
              <div className="text-center">
                <p className="text-white font-medium">{currentPhoto.originalName}</p>
                <p className="text-gray-300 text-sm">
                  {isZoomed ? 'Double tap to zoom out' : 'Double tap to zoom in'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Photo indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/70'
                }
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
};