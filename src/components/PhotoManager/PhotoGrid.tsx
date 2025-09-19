import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Trash2, Eye } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { useUIStore } from '../../stores/uiStore';
import { createObjectURL, revokeObjectURL } from '../../utils/helpers';
import { FileHandlerService } from '../../services/fileHandler';
import { useToast } from '../UI/Toast';

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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative aspect-square group cursor-pointer"
      onClick={() => onView(photo.id)}
    >
      {/* Image */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-800">
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
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}

        {/* Overlay controls */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(photo.id);
              }}
              className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <Eye className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
              }}
              className="w-10 h-10 bg-red-500 bg-opacity-80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        </div>

        {/* Photo order indicator */}
        <div className="absolute top-2 left-2 w-6 h-6 bg-black bg-opacity-50 backdrop-blur-sm rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-medium">{photo.order + 1}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const PhotoManager: React.FC = () => {
  const { photos, removePhoto, canAddMorePhotos, addPhotos } = usePhotoStore();
  const { setCurrentView } = useUIStore();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
      toast.success('Photo removed');
    } catch (error) {
      toast.error('Failed to remove photo');
    } finally {
      setIsDeleting(null);
    }
  }, [removePhoto, isDeleting, toast]);

  const handleAddMorePhotos = useCallback(async () => {
    try {
      const files = await FileHandlerService.selectFiles({
        multiple: true,
        maxFiles: 10 - photos.length,
      });

      if (files.length > 0) {
        const result = await addPhotos(files);

        if (result.success.length > 0) {
          toast.success(`Added ${result.success.length} photo${result.success.length > 1 ? 's' : ''}`);
        }

        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} files couldn't be added`);
        }
      }
    } catch (error) {
      toast.error('Failed to add photos');
    }
  }, [photos.length, addPhotos, toast]);

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-400">No photos in your wallet yet</p>
          <button
            onClick={() => setCurrentView('welcome')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Photos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 safe-area-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Photo Wallet</h1>
          <p className="text-gray-400 text-sm">{photos.length} of 10 photos</p>
        </div>

        <div className="flex space-x-2">
          {canAddMorePhotos() && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddMorePhotos}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

        {/* Add more button */}
        {canAddMorePhotos() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddMorePhotos}
            className="aspect-square border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg flex items-center justify-center cursor-pointer transition-colors group"
          >
            <div className="text-center space-y-2">
              <div className="w-10 h-10 mx-auto bg-gray-700 group-hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 group-hover:text-gray-300">Add Photo</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Empty slots indicators */}
      {photos.length < 10 && (
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            {10 - photos.length} more photo{10 - photos.length !== 1 ? 's' : ''} can be added
          </p>
        </div>
      )}
    </div>
  );
};