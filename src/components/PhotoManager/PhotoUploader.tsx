import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image, Camera, Plus, FileText } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { useUIStore } from '../../stores/uiStore';
import { FileHandlerService } from '../../services/fileHandler';
import { LoadingSpinner, ProgressBar } from '../UI/LoadingSpinner';
import { useToast } from '../UI/Toast';

export const PhotoUploader: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { addPhotos, uploadProgress, hasPhotos } = usePhotoStore();
  const { setCurrentView } = useUIStore();
  const toast = useToast();

  // Handle file selection
  const handleFileSelect = useCallback(async () => {
    try {
      const files = await FileHandlerService.selectFiles({
        multiple: true,
        maxFiles: 10,
      });

      if (files.length > 0) {
        await handleFilesUpload(files);
      }
    } catch (error) {
      console.error('File selection error:', error);
      toast.error('Failed to select files');
    }
  }, []);

  // Handle file upload
  const handleFilesUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const result = await addPhotos(files);

      if (result.success.length > 0) {
        toast.success(`Added ${result.success.length} photo${result.success.length > 1 ? 's' : ''}`);

        // Navigate to manager view after successful upload
        if (await hasPhotos()) {
          setCurrentView('manager');
        }
      }

      if (result.errors.length > 0) {
        const errorMessage = result.errors.length === 1
          ? result.errors[0].message
          : `${result.errors.length} files couldn't be added`;
        toast.warning(errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  }, [addPhotos, hasPhotos, setCurrentView, toast]);

  // Set up drag and drop
  React.useEffect(() => {
    const dropZone = document.getElementById('photo-drop-zone');
    if (!dropZone) return;

    const cleanup = FileHandlerService.setupDropZone(
      dropZone,
      async ({ files }) => {
        await handleFilesUpload(files);
      },
      setIsDragging
    );

    return cleanup;
  }, [handleFilesUpload]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center"
          >
            <Image className="w-10 h-10 text-gray-400" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">
              Photo Wallet
            </h1>
            <p className="text-gray-400 text-lg">
              Your favorite photos, always with you
            </p>
          </div>
        </motion.div>

        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          id="photo-drop-zone"
          className={`
            relative border-2 border-dashed rounded-xl p-8 transition-all duration-300
            ${isDragging
              ? 'border-blue-400 bg-blue-500/10 scale-105'
              : 'border-gray-600 hover:border-gray-500'
            }
            ${isUploading ? 'pointer-events-none' : 'cursor-pointer'}
          `}
          onClick={!isUploading ? handleFileSelect : undefined}
        >
          {isUploading ? (
            <div className="space-y-4">
              <LoadingSpinner size="large" />
              <div className="space-y-2">
                <p className="text-white font-medium">Uploading photos...</p>
                <ProgressBar progress={uploadProgress} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <motion.div
                animate={{ y: isDragging ? -5 : 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center transition-colors
                    ${isDragging ? 'bg-blue-500' : 'bg-gray-700'}
                  `}>
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-medium">
                    {isDragging ? 'Drop your photos here' : 'Add your first photos'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Drag & drop or click to select up to 10 photos
                  </p>
                </div>
              </motion.div>

              {/* Supported formats */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Supported formats:</p>
                <p>JPEG, PNG, WebP, HEIC</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-3 gap-4 text-center"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">
              Store locally
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">
              Up to 10 photos
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">
              No tracking
            </p>
          </div>
        </motion.div>

        {/* App info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-xs text-gray-500 space-y-1"
        >
          <p>Progressive Web App • Works offline</p>
          <p>Your photos stay on your device</p>
        </motion.div>
      </div>
    </div>
  );
};