import React, { useCallback, useState, useRef } from 'react';
import { FileHandler } from '../services/fileHandler';
import { APP_CONFIG } from '../utils/constants';
import { useAppContext } from '../contexts/AppContext';

export const PhotoUploader: React.FC = () => {
  const { photos, isLoading, error, actions } = useAppContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const { validFiles, errors: fileErrors } = FileHandler.validateFiles(files);

      if (fileErrors.length > 0) {
        console.warn('File validation errors:', fileErrors);
      }

      if (validFiles.length > 0) {
        await actions.addPhotos(validFiles);
      }
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  }, [actions]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const { validFiles, errors: fileErrors } = FileHandler.validateFiles(files);

      if (fileErrors.length > 0) {
        console.warn('File validation errors:', fileErrors);
      }

      if (validFiles.length > 0) {
        await actions.addPhotos(validFiles);
      }
    }
  }, [actions]);

  const canAddPhotos = photos.length < APP_CONFIG.MAX_PHOTOS;

  return (
    <div className="w-full h-full flex flex-col safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Photo Wallet</h1>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          data-testid="file-input"
        />
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Photo Wallet</h1>
          <p className="text-gray-400 text-lg">
            {photos.length === 0
              ? 'Add photos to your wallet'
              : `${photos.length} photos added`
            }
          </p>
        </div>

      {canAddPhotos ? (
        <div
          className={`
            relative w-full max-w-md h-64 border-2 border-dashed rounded-lg
            transition-all duration-200 cursor-pointer
            ${isDragOver
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-gray-600 hover:border-gray-500'
            }
            ${isLoading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>

            {isLoading ? (
              <div className="text-white">
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Adding photos...</p>
              </div>
            ) : (
              <>
                <p className="text-white text-lg font-medium mb-2">
                  {isDragOver ? 'Drop photos here' : 'Add Photos'}
                </p>
                <p className="text-gray-400 text-sm">
                  Tap here or drag and drop
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-white text-lg font-medium mb-2">Wallet Full</p>
          <p className="text-gray-400">
            Remove some photos to add new ones.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 w-full max-w-md">
          <div className="bg-red-500/20 border border-red-500 rounded p-3 mb-2">
            <p className="text-red-200 text-sm">{error.message}</p>
            {error.fileName && (
              <p className="text-red-300 text-xs mt-1">File: {error.fileName}</p>
            )}
          </div>
        </div>
      )}

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Supports JPEG, PNG, WebP images<br />
            Maximum file size: 50MB each
          </p>
        </div>
      </div>
    </div>
  );
};