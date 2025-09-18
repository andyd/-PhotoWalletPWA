import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Photo } from '../types';
import { createObjectURL, revokeObjectURL } from '../utils/imageProcessing';
import { useAppContext } from '../contexts/AppContext';

interface PhotoWithURL extends Photo {
  objectURL: string;
}

export const PhotoManager: React.FC = () => {
  const { photos, actions } = useAppContext();
  const [photosWithURLs, setPhotosWithURLs] = useState<PhotoWithURL[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const photoURLs = useMemo(() => {
    return photos.map(photo => ({
      ...photo,
      objectURL: createObjectURL(photo.blob),
    }));
  }, [photos]);

  useEffect(() => {
    setPhotosWithURLs(photoURLs);

    // Cleanup previous URLs when photos change
    return () => {
      photoURLs.forEach(photo => {
        try {
          revokeObjectURL(photo.objectURL);
        } catch (error) {
          // URL might already be revoked, ignore error
        }
      });
    };
  }, [photoURLs]);

  const handlePhotoClick = (index: number) => {
    actions.goToSlide(index);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      actions.addPhotos(files);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    setSelectedPhotoId(photoId);
  };

  const confirmDelete = () => {
    if (selectedPhotoId) {
      actions.removePhoto(selectedPhotoId);
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
      actions.reorderPhotos(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (photos.length === 0) {
    return (
      <div className="w-full h-full flex flex-col safe-area-inset">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Photo Wallet</h2>
          <div></div>
        </div>

        {/* Empty state with add functionality */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Photos Yet</h2>
            <p className="text-gray-400 mb-6">Add some photos to get started</p>
            
            {/* Add photos functionality */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Add Photos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col safe-area-inset">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">
          Photo Wallet ({photos.length})
        </h2>
        <div className="flex gap-2">
          {/* Add Photos Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Add Photos"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photosWithURLs.map((photo, index) => (
            <div
              key={photo.id}
              className={`
                relative aspect-square rounded-lg overflow-hidden cursor-pointer
                transform transition-all duration-200 hover:scale-105 group
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

              {/* Delete button - only visible on hover */}
              <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={(e) => handleDeleteClick(e, photo.id)}
                  className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors pointer-events-auto"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 flex justify-center">
        <button
          onClick={() => actions.goToSlide(0)}
          disabled={photos.length === 0}
          className="w-16 h-16 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Clear All Photos */}
              <button
                onClick={() => {
                  actions.clearAllPhotos();
                  setShowSettings(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Clear All Photos
              </button>
              
              {/* Close Settings */}
              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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