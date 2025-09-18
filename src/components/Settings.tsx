import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Photo } from '../types';
import { createObjectURL, revokeObjectURL } from '../utils/imageProcessing';
import { FileHandler } from '../services/fileHandler';
import { useAppContext } from '../contexts/AppContext';
import { APP_CONFIG } from '../utils/constants';

interface PhotoWithURL extends Photo {
  objectURL: string;
}

export const Settings: React.FC = () => {
  const { photos, actions } = useAppContext();
  const [photosWithURLs, setPhotosWithURLs] = useState<PhotoWithURL[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        const { validFiles } = FileHandler.validateFiles(files);
        if (validFiles.length > 0) {
          await actions.addPhotos(validFiles);
        }
      } catch (error) {
        console.error('Error adding photos:', error);
      } finally {
        setIsUploading(false);
      }
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  }, [actions]);

  const handlePhotoSelect = useCallback((photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  }, [selectedPhotos.size, photos]);

  const handleDeleteSelected = useCallback(() => {
    selectedPhotos.forEach(photoId => {
      actions.removePhoto(photoId);
    });
    setSelectedPhotos(new Set());
  }, [selectedPhotos, actions]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      actions.reorderPhotos(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  }, [draggedIndex, actions]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);


  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        data-testid="settings-file-input"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <button
          onClick={() => actions.goToHome()}
          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Photo count and controls */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={handleFileSelect}
              disabled={photos.length >= APP_CONFIG.MAX_PHOTOS || isUploading}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${photos.length >= APP_CONFIG.MAX_PHOTOS || isUploading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {isUploading ? 'Adding...' : 'Add Photos'}
            </button>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedPhotos.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                >
                  Delete Selected ({selectedPhotos.size})
                </button>
              )}
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-sm transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Photos grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Photos</h3>
            <p className="text-gray-400 mb-4">Add some photos to get started</p>
            <button
              onClick={handleFileSelect}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add Photos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photosWithURLs.map((photo, index) => (
              <div
                key={photo.id}
                className={`
                  relative aspect-square rounded-lg overflow-hidden cursor-pointer
                  transform transition-all duration-200
                  ${draggedIndex === index ? 'opacity-50 scale-95' : 'hover:scale-105'}
                  ${selectedPhotos.has(photo.id) ? 'ring-2 ring-blue-500' : ''}
                `}
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

                {/* Selection overlay */}
                <div
                  className={`
                    absolute inset-0 transition-all duration-200
                    ${selectedPhotos.has(photo.id)
                      ? 'bg-blue-500 bg-opacity-30'
                      : 'bg-black bg-opacity-0 hover:bg-opacity-20'
                    }
                  `}
                  onClick={() => handlePhotoSelect(photo.id)}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-2 right-2">
                    <div className={`
                      w-6 h-6 rounded-full border-2 transition-all duration-200
                      ${selectedPhotos.has(photo.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-black bg-opacity-50 border-white'
                      }
                      flex items-center justify-center
                    `}>
                      {selectedPhotos.has(photo.id) && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Order number */}
                  <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {index + 1}
                  </div>

                  {/* Drag handle */}
                  <div className="absolute bottom-2 right-2 text-white opacity-70 hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <p className="text-gray-400 text-sm text-center">
          Tap photos to select • Drag to reorder • Double-tap screen or tap bottom to close
        </p>
      </div>

      {/* Clear all confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Clear All Photos?</h3>
            <p className="text-gray-400 mb-6">
              This will permanently remove all {photos.length} photos from your wallet. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  actions.clearAllPhotos();
                  setShowClearConfirm(false);
                  setSelectedPhotos(new Set());
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};