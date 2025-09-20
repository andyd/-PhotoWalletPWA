import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image, Camera, Plus, FileText, RotateCcw } from 'lucide-react';
import { usePhotoStore } from '../../stores/photoStore';
import { useUIStore } from '../../stores/uiStore';
import { FileHandlerService } from '../../services/fileHandler';
import { LoadingSpinner, ProgressBar } from '../UI/LoadingSpinner';
import { useToast } from '../UI/Toast';
import { photoStorageService } from '../../services/photoStorage';

export const PhotoUploader: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { addPhotos, uploadProgress, hasPhotos, clearAllPhotos, loadPhotos } = usePhotoStore();
  const { setCurrentView } = useUIStore();
  const toast = useToast();

  // Handle file selection
  const handleFileSelect = useCallback(async () => {
    try {
      const files = await FileHandlerService.selectFiles({
        multiple: true,
        maxFiles: 100, // Allow many files at once
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

  // Set up drag and drop on the entire screen
  React.useEffect(() => {
    const cleanup = FileHandlerService.setupDropZone(
      document.body,
      async ({ files }) => {
        await handleFilesUpload(files);
      },
      setIsDragging
    );

    return cleanup;
  }, [handleFilesUpload]);

  // Handle app reset
  const handleResetApp = useCallback(async () => {
    try {
      console.log('🧹 Starting aggressive app reset...');

      // Show loading state
      toast.success('Resetting app...');

      // Clear all photos from storage service
      await photoStorageService.clearAllPhotos();
      console.log('✅ Photo storage cleared');

      // Clear Zustand stores
      await clearAllPhotos();
      console.log('✅ Zustand stores cleared');

      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Browser storage cleared');

      // Aggressively clear IndexedDB
      try {
        const databases = await indexedDB.databases();
        console.log('🔍 Found databases:', databases.map(db => db.name));

        for (const db of databases) {
          if (db.name) {
            await new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => {
                console.log(`🗑️ Deleted database: ${db.name}`);
                resolve();
              };
              deleteReq.onerror = () => {
                console.error(`❌ Failed to delete: ${db.name}`);
                reject(deleteReq.error);
              };
              deleteReq.onblocked = () => {
                console.warn(`⚠️ Blocked deleting: ${db.name}`);
                resolve(); // Continue anyway
              };
            });
          }
        }
      } catch (dbError) {
        console.error('IndexedDB clearing error:', dbError);
      }

      // Clear service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('🧹 Service worker unregistered');
        }
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 All caches cleared');
      }

      console.log('✅ Reset complete - reloading page...');

      // Force reload with cache bypass
      window.location.href = window.location.href + '?t=' + Date.now();

    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Reset failed - try manual browser clear');
    }
  }, [clearAllPhotos, toast]);

  const confirmReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const cancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile Status Bar */}
      <div className="flex justify-between items-center text-sm font-medium px-6 pt-4 pb-2" style={{ color: 'var(--text-primary)' }}>
        <span className="text-base font-semibold">9:41</span>
        <div className="flex space-x-1">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--text-secondary)' }}></div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs">📶</span>
          <span className="text-xs">📶</span>
          <span className="text-xs">🔋</span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 pb-8 max-w-md mx-auto w-full">
        {/* App Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-display font-bold text-center" style={{ color: 'var(--text-primary)' }}>
            PHOTO WALLET
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mb-20"
        >
          <p className="text-subtitle text-center leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Show and share in seconds
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="w-full max-w-xs"
        >
            {isUploading ? (
              <div className="space-y-6 py-8">
                <LoadingSpinner size="large" />
                <div className="space-y-4">
                  <p className="text-body font-medium text-center" style={{ color: 'var(--text-primary)' }}>Adding photos...</p>
                  <ProgressBar progress={uploadProgress} />
                </div>
              </div>
            ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFileSelect}
              className="w-full btn-primary text-xl font-bold py-6 px-8 rounded-2xl transition-all duration-300"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)'
              }}
            >
              Add Photos
            </motion.button>
            )}
          </motion.div>
        </div>

      {/* Hidden Reset Button - Bottom Right */}
      <motion.button
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 0.3 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={confirmReset}
        className="fixed bottom-4 right-4 w-12 h-12 bg-red-600/20 hover:bg-red-600/40 rounded-full flex items-center justify-center transition-all duration-200 z-[9999] border border-red-500/20 backdrop-blur-sm"
        title="Reset App (Development)"
        style={{ pointerEvents: 'auto' }}
      >
        <RotateCcw className="w-5 h-5 text-red-300" />
      </motion.button>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-elevated max-w-md w-full space-y-6 mx-auto"
            style={{ position: 'relative', zIndex: 10001 }}
          >
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg" style={{ backgroundColor: 'var(--color-bad)' }}>
                <RotateCcw className="w-8 h-8" style={{ color: 'var(--bg-primary)' }} />
              </div>
              <div className="space-y-3">
                <h3 className="text-title" style={{ color: 'var(--text-primary)' }}>
                  Reset Photo Wallet?
                </h3>
                <p className="text-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  This will permanently delete all photos and reset the app to its initial state.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={cancelReset}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetApp}
                className="flex-1 px-6 py-3 rounded-xl transition-colors font-semibold"
                style={{ 
                  background: 'var(--color-bad)', 
                  color: 'var(--bg-primary)',
                  border: 'none'
                }}
              >
                Reset App
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};