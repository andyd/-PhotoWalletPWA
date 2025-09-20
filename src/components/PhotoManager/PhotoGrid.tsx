import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Trash2, Eye, RotateCcw, ChevronLeft } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { useUIStore } from '../../stores/uiStore';
import { createObjectURL, revokeObjectURL } from '../../utils/helpers';
import { FileHandlerService } from '../../services/fileHandler';
import { useToast } from '../UI/Toast';
import { photoStorageService } from '../../services/photoStorage';

interface PhotoCardProps {
  photo: {
    id: string;
    originalName: string;
    blob: Blob;
    order: number;
  };
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onView, onDelete }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    const url = createObjectURL(photo.blob);
    setImageUrl(url);

    return () => {
      revokeObjectURL(url);
    };
  }, [photo.blob]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="photo-thumbnail group"
      onClick={() => onView(photo.id)}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={photo.originalName}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={handleImageLoad}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="photo-skeleton" />
      )}

      {/* Photo order indicator */}
      <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' }}>
        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{photo.order + 1}</span>
      </div>

      {/* Long press menu */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-50 sm:group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-active:opacity-100 sm:group-hover:opacity-100">
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(photo.id);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}
          >
            <Eye className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--color-bad)', opacity: 0.9 }}
          >
            <Trash2 className="w-4 h-4" style={{ color: 'var(--bg-primary)' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const PhotoManager: React.FC = () => {
  const { photos, removePhoto, canAddMorePhotos, addPhotos, clearAllPhotos } = usePhotoStore();
  const { setCurrentView } = useUIStore();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleViewPhoto = useCallback((id: string) => {
    const index = photos.findIndex(p => p.id === id);
    if (index !== -1) {
      // Set the current photo and switch to viewer
      usePhotoStore.getState().setCurrentIndex(index);
      setCurrentView('viewer');
    }
  }, [photos, setCurrentView]);

  const handleDeletePhoto = useCallback(async (id: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(id);
      await removePhoto(id);
      toast.show('Photo deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.show('Failed to delete photo', 'error');
    } finally {
      setIsDeleting(null);
    }
  }, [removePhoto, toast, isDeleting]);

  const handleAddMorePhotos = useCallback(async () => {
    try {
      const fileHandler = new FileHandlerService();
      const files = await fileHandler.selectFiles();
      
      if (files.length > 0) {
        await addPhotos(files);
        toast.show(`${files.length} photo${files.length !== 1 ? 's' : ''} added successfully`, 'success');
      }
    } catch (error) {
      console.error('Error adding photos:', error);
      toast.show('Failed to add photos', 'error');
    }
  }, [addPhotos, toast]);

  const confirmReset = () => {
    setShowResetConfirm(true);
  };

  const handleReset = async () => {
    try {
      await clearAllPhotos();
      await photoStorageService.clearAllPhotos();
      setShowResetConfirm(false);
      toast.show('App reset successfully', 'success');
      setCurrentView('welcome');
    } catch (error) {
      console.error('Error resetting app:', error);
      toast.show('Failed to reset app', 'error');
    }
  };

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Mobile Status Bar */}
        <div className="w-full h-6 flex items-center justify-between px-4 text-xs" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <span className="text-xs">9:41</span>
          <div className="flex items-center space-x-1">
            <span className="text-xs">📶</span>
            <span className="text-xs">📶</span>
            <span className="text-xs">🔋</span>
          </div>
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('welcome')}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <ChevronLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
            </motion.button>
            <div>
              <h1 className="text-title" style={{ color: 'var(--text-primary)' }}>My Images (0)</h1>
            </div>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center space-y-8 max-w-xs mx-auto">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="w-8 h-8 flex items-center justify-center text-2xl">📷</div>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>No photos yet</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add your first photos to get started</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('welcome')}
              className="btn-primary w-full text-base font-semibold py-4 px-6 rounded-xl transition-all duration-300"
              style={{ 
                background: 'var(--accent-primary)', 
                color: 'var(--bg-primary)',
                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.1)'
              }}
            >
              + Add Photos
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile Status Bar */}
      <div className="w-full h-6 flex items-center justify-between px-4 text-xs" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <span className="text-xs">9:41</span>
        <div className="flex items-center space-x-1">
          <span className="text-xs">📶</span>
          <span className="text-xs">📶</span>
          <span className="text-xs">🔋</span>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView('welcome')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </motion.button>
          <div>
            <h1 className="text-title" style={{ color: 'var(--text-primary)' }}>My Images ({photos.length})</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canAddMorePhotos() && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddMorePhotos}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Plus className="w-6 h-6" style={{ color: 'var(--bg-primary)' }} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={confirmReset}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            title="Settings & Reset"
          >
            <Settings className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </motion.button>
        </div>
      </div>

      {/* Photo Grid Container */}
      <div className="photo-grid">
        <AnimatePresence>
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onView={handleViewPhoto}
              onDelete={handleDeletePhoto}
            />
          ))}
        </AnimatePresence>

        {/* Add Photo Button */}
        {canAddMorePhotos() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddMorePhotos}
            className="add-photo-button"
          >
            <div className="icon">+</div>
            <div className="text">ADD</div>
          </motion.div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-8 max-w-sm mx-4"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: 'var(--color-bad)' }}>
                <RotateCcw className="w-8 h-8" style={{ color: 'var(--bg-primary)' }} />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reset App</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  This will delete all photos and reset the app to its initial state. This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="btn-primary flex-1"
                  style={{ backgroundColor: 'var(--color-bad)' }}
                >
                  Reset App
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
