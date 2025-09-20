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
      <div className="min-h-screen bg-black flex items-center justify-center safe-area-all">
        <div className="text-center space-y-4 px-4">
          <p className="text-gray-400 text-lg">No photo to display</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('manager')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl transition-colors font-semibold touch-button"
          >
            Back to Gallery
          </motion.button>
        </div>
      </div>
    );
  }

  const imageUrl = imageUrls.get(currentPhoto.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onClick={showControlsTemporarily}
    >
      {/* Image container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
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
                className="w-full h-full object-contain select-none"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
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
              className="absolute top-0 left-0 right-0 p-6 safe-area-top"
              style={{ background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent)' }}
            >
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <button
                  onClick={() => setCurrentView('manager')}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-colors touch-button shadow-lg"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
                >
                  <X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {currentIndex + 1} of {photos.length}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-colors touch-button shadow-lg"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
                  >
                    <Share className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  </button>

                  <button
                    onClick={() => setCurrentView('manager')}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-colors touch-button shadow-lg"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
                  >
                    <Grid className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
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
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-colors touch-button shadow-lg"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
                >
                  <ChevronLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={goToNext}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-colors touch-button shadow-lg"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
                >
                  <ChevronRight className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                </motion.button>
              </>
            )}

            {/* Bottom info */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-0 left-0 right-0 p-6 safe-area-bottom"
              style={{ background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)' }}
            >
              <div className="text-center max-w-6xl mx-auto">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentPhoto.originalName}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {isZoomed ? 'Double tap to zoom out' : 'Double tap to zoom in'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};