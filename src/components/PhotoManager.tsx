import React, { useState, useEffect, useMemo } from 'react';
import { Photo } from '../types';
import { createObjectURL, revokeObjectURL } from '../utils/imageProcessing';

interface PhotoManagerProps {
  photos: Photo[];
  onPhotoSelect: (index: number) => void;
  onPhotoDelete: (id: string) => void;
  onReorderPhotos: (fromIndex: number, toIndex: number) => void;
  onAddPhotos: () => void;
}

interface PhotoWithURL extends Photo {
  objectURL: string;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  onPhotoSelect,
  onPhotoDelete,
  onReorderPhotos,
  onAddPhotos,
}) => {
  const [photosWithURLs, setPhotosWithURLs] = useState<PhotoWithURL[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const photoURLs = useMemo(() => {
    return photos.map(photo => ({
      ...photo,
      objectURL: createObjectURL(photo.blob),
    }));
  }, [photos]);

  useEffect(() => {
    setPhotosWithURLs(photoURLs);

    return () => {
      photoURLs.forEach(photo => revokeObjectURL(photo.objectURL));
    };
  }, [photoURLs]);

  const handlePhotoClick = (index: number) => {
    onPhotoSelect(index);
  };

  const handleDeleteClick = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    setSelectedPhotoId(photoId);
  };

  const confirmDelete = () => {
    if (selectedPhotoId) {
      onPhotoDelete(selectedPhotoId);
      setSelectedPhotoId(null);
    }
  };

  const cancelDelete = () => {
    setSelectedPhotoId(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderPhotos(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (photos.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Photos Yet</h2>
          <p className="text-gray-400 mb-6">Add some photos to get started</p>
          <button
            onClick={onAddPhotos}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Add Photos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col safe-area-inset">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">
          Photo Wallet ({photos.length}/10)
        </h2>
        <button
          onClick={onAddPhotos}
          disabled={photos.length >= 10}
          className={`
            font-medium py-2 px-4 rounded-lg transition-colors
            ${photos.length >= 10
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          Add More
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photosWithURLs.map((photo, index) => (
            <div
              key={photo.id}
              className={`
                relative aspect-square rounded-lg overflow-hidden cursor-pointer
                transform transition-all duration-200 hover:scale-105
                ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              `}
              onClick={() => handlePhotoClick(index)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <img
                src={photo.objectURL}
                alt={photo.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200">
                <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDeleteClick(e, photo.id)}
                    className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => handlePhotoClick(0)}
          disabled={photos.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Start Slideshow
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {selectedPhotoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Delete Photo?</h3>
            <p className="text-gray-400 mb-6">
              This action cannot be undone. The photo will be permanently removed from your wallet.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};