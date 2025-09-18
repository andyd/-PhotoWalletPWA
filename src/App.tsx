import { useEffect, useCallback } from 'react';
import { usePhotoWallet } from './hooks/usePhotoWallet';
import { useSettingsTrigger } from './hooks/useSettingsTrigger';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoManager } from './components/PhotoManager';
import { PhotoViewer } from './components/PhotoViewer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useAppContext } from './contexts/AppContext';

function AppContent() {
  const {
    currentView,
    error,
    isInstallable,
    isOffline,
    actions,
  } = useAppContext();

  const handleShowSettings = useCallback(() => {
    // Settings are now handled within PhotoManager
    console.log('Settings triggered');
  }, []);

  // Simplified settings trigger - just double-tap
  const { bindDoubleTap } = useSettingsTrigger({
    onOpenSettings: handleShowSettings,
  });

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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'setup':
        return <PhotoUploader />;

      case 'slide':
        return <PhotoViewer />;

      case 'home':
      default:
        return <PhotoManager />;
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
        {isInstallable && currentView !== 'slide' && (
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
          {...(currentView === 'home' ? bindDoubleTap : {})}
        >
          {renderCurrentView()}
        </div>

        {/* Error Toast */}
        {error && currentView !== 'setup' && currentView !== 'add' && (
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

function App() {
  const photoWallet = usePhotoWallet();

  return (
    <AppProvider value={{
      currentView: photoWallet.currentView,
      photos: photoWallet.photos,
      currentPhotoIndex: photoWallet.currentPhotoIndex,
      isLoading: photoWallet.isLoading,
      error: photoWallet.error,
      isInstallable: photoWallet.isInstallable,
      isOffline: photoWallet.isOffline,
      actions: {
        goToSetup: photoWallet.actions.goToSetup,
        goToHome: photoWallet.actions.goToHome,
        goToSlide: photoWallet.actions.goToSlide,
        setCurrentPhotoIndex: photoWallet.actions.setCurrentPhotoIndex,
        clearError: photoWallet.actions.clearError,
        setInstallable: photoWallet.actions.setInstallable,
        addPhotos: photoWallet.actions.addPhotos,
        removePhoto: photoWallet.actions.removePhoto,
        reorderPhotos: photoWallet.actions.reorderPhotos,
        clearAllPhotos: photoWallet.actions.clearAllPhotos,
      },
    }}>
      <AppContent />
    </AppProvider>
  );
}

export default App;