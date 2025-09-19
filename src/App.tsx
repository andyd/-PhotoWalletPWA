import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotoStore } from './stores/photoStore';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore } from './stores/settingsStore';
import { PhotoManager } from './components/PhotoManager/PhotoGrid';
import { PhotoViewer } from './components/PhotoViewer/PhotoViewer';
import { PhotoUploader } from './components/PhotoManager/PhotoUploader';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { Toast } from './components/UI/Toast';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const { currentView, isInitialized, initialize, toasts, setCurrentView } = useUIStore();
  const { isLoading: photosLoading, loadPhotos, hasPhotos } = usePhotoStore();
  const { loadSettings, isLoading: settingsLoading } = useSettingsStore();

  const isLoading = photosLoading || settingsLoading || !isInitialized;

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([
        initialize(),
        loadSettings(),
        loadPhotos(),
      ]);

      // Determine initial view based on photos
      const hasPhotosAvailable = await hasPhotos();
      if (hasPhotosAvailable) {
        setCurrentView('manager');
      } else {
        setCurrentView('welcome');
      }
    };

    initializeApp();
  }, [initialize, loadSettings, loadPhotos, hasPhotos, setCurrentView]);

  // Show loading screen during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome':
        return <PhotoUploader />;

      case 'manager':
        return <PhotoManager />;

      case 'viewer':
        return <PhotoViewer />;

      default:
        return <PhotoUploader />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <ErrorBoundary>
        {/* Main content with view transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="min-h-screen"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>

        {/* Toast notifications */}
        <div className="fixed bottom-4 left-4 right-4 z-50 space-y-2">
          <AnimatePresence>
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                id={toast.id}
                message={toast.message}
                type={toast.type}
              />
            ))}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;