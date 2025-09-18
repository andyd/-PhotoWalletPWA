import { useEffect, useCallback } from 'react';
import { usePhotoWallet } from './hooks/usePhotoWallet';
import { useSettingsTrigger } from './hooks/useSettingsTrigger';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoManager } from './components/PhotoManager';
import { PhotoViewer } from './components/PhotoViewer';
import { Settings } from './components/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const {
    photos,
    currentView,
    currentPhotoIndex,
    isLoading,
    error,
    isInstallable,
    isOffline,
    actions,
  } = usePhotoWallet();

  const handleAddPhotos = useCallback(async (files: File[]) => {
    await actions.addPhotos(files);
  }, [actions]);

  const handlePhotoSelect = useCallback((index: number) => {
    actions.setCurrentPhotoIndex(index);
    actions.setCurrentView('viewer');
  }, [actions]);

  const handlePhotoDelete = useCallback((id: string) => {
    actions.removePhoto(id);
  }, [actions]);

  const handleReorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    actions.reorderPhotos(fromIndex, toIndex);
  }, [actions]);

  const handlePhotoChange = useCallback((index: number) => {
    actions.setCurrentPhotoIndex(index);
  }, [actions]);

  const handleShowUploader = useCallback(() => {
    actions.setCurrentView('uploader');
  }, [actions]);

  const handleShowSettings = useCallback(() => {
    actions.setCurrentView('settings');
  }, [actions]);

  const handleCloseSettings = useCallback(() => {
    if (photos.length === 0) {
      actions.setCurrentView('uploader');
    } else {
      actions.setCurrentView('manager');
    }
  }, [actions, photos.length]);

  // Set up settings trigger for double-tap and lower screen tap
  const { bindTouch, bindClick, temporarilyDisable } = useSettingsTrigger({
    onOpenSettings: handleShowSettings,
  });

  const handleCloseViewer = useCallback(() => {
    temporarilyDisable(1500); // Disable settings trigger for 1.5 seconds
    actions.setCurrentView('manager');
  }, [actions, temporarilyDisable]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      actions.setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [actions]);

  useEffect(() => {
    if (photos.length === 0) {
      actions.setCurrentView('uploader');
    } else if (currentView === 'uploader') {
      actions.setCurrentView('manager');
    }
  }, [photos.length, currentView, actions]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'uploader':
        return (
          <PhotoUploader
            onPhotosSelected={handleAddPhotos}
            currentPhotoCount={photos.length}
            isLoading={isLoading}
            errors={error ? [error] : []}
          />
        );

      case 'viewer':
        return (
          <PhotoViewer
            photos={photos}
            initialIndex={currentPhotoIndex}
            onClose={handleCloseViewer}
            onPhotoChange={handlePhotoChange}
          />
        );

      case 'settings':
        return (
          <Settings
            photos={photos}
            onClose={handleCloseSettings}
            onAddPhotos={handleAddPhotos}
            onRemovePhoto={handlePhotoDelete}
            onReorderPhotos={handleReorderPhotos}
            onClearAllPhotos={actions.clearAllPhotos}
          />
        );

      case 'manager':
      default:
        return (
          <PhotoManager
            photos={photos}
            onPhotoSelect={handlePhotoSelect}
            onPhotoDelete={handlePhotoDelete}
            onReorderPhotos={handleReorderPhotos}
            onAddPhotos={handleShowUploader}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-black text-white overflow-hidden select-none">
        {/* Offline Indicator */}
        {isOffline && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-black text-center py-2 text-sm font-medium z-40">
            You're offline. The app will continue to work normally.
          </div>
        )}

        {/* Install Prompt */}
        {isInstallable && currentView !== 'viewer' && (
          <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm z-40">
            <button
              onClick={async () => {
                const event = (window as any).deferredPrompt;
                if (event) {
                  event.prompt();
                  const { outcome } = await event.userChoice;
                  if (outcome === 'accepted') {
                    actions.setInstallable(false);
                  }
                }
              }}
              className="underline hover:no-underline"
            >
              Install Photo Wallet for a better experience
            </button>
            <button
              onClick={() => actions.setInstallable(false)}
              className="ml-4 text-blue-200 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`w-full h-full ${isOffline || isInstallable ? 'pt-10' : ''}`}
          {...(currentView === 'manager' ? { ...bindTouch, ...bindClick } : {})}
        >
          {renderCurrentView()}
        </div>

        {/* Error Toast */}
        {error && currentView !== 'uploader' && (
          <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{error.message}</p>
                {error.fileName && (
                  <p className="text-sm text-red-200 mt-1">File: {error.fileName}</p>
                )}
              </div>
              <button
                onClick={actions.clearError}
                className="ml-4 text-red-200 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;