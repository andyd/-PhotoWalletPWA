import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple in-memory stores (no persistence for now)
let photos: Array<{id: string, name: string, data: string}> = [];
let currentView = 'welcome';

// Simple store functions
const addPhoto = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    photos.push({
      id: Date.now().toString(),
      name: file.name,
      data: e.target?.result as string
    });
    currentView = 'photos';
    // Trigger re-render
    window.dispatchEvent(new Event('state-change'));
  };
  reader.readAsDataURL(file);
};

const removePhoto = (id: string) => {
  photos = photos.filter(p => p.id !== id);
  window.dispatchEvent(new Event('state-change'));
};

const setView = (view: string) => {
  currentView = view;
  window.dispatchEvent(new Event('state-change'));
};

// Welcome Screen
const WelcomeScreen = () => {
  const [isUploading, setIsUploading] = React.useState(false);

  const handleAddPhotos = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        setIsUploading(true);
        files.forEach(file => addPhoto(file));
        setTimeout(() => setIsUploading(false), 1000);
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-md mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-display font-bold" style={{ color: 'var(--text-primary)' }}>
            Photo Wallet
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="mb-20"
        >
          <p className="text-subtitle leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your important photos at your fingertips, like how your dad had them in his wallet back in the day.
          </p>
        </motion.div>

        {isUploading ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 py-8"
          >
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>Adding photos...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="w-full max-w-xs mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddPhotos}
              className="w-full btn-primary text-xl font-bold py-6 px-8 rounded-2xl transition-all duration-300"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)'
              }}
            >
              Add Photos
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Photos Screen
const PhotosScreen = () => {
  const [showReset, setShowReset] = React.useState(false);

  const handleViewPhoto = (index: number) => {
    // Set the current photo index before switching to viewer
    (window as any).currentPhotoIndex = index;
    setView('viewer');
  };

  const handleDeletePhoto = (id: string) => {
    removePhoto(id);
  };

  const handleReset = () => {
    photos = [];
    setView('welcome');
    setShowReset(false);
  };

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h1 className="text-title" style={{ color: 'var(--text-primary)' }}>My Images (0)</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReset(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            title="Settings & Reset"
          >
            <span className="text-lg" style={{ color: 'var(--text-primary)' }}>⚙️</span>
          </motion.button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-md mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <span className="text-3xl">📷</span>
            </motion.div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>No photos yet</h2>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Add your first photos to get started</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                
                input.onchange = (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || []);
                  if (files.length > 0) {
                    files.forEach(file => addPhoto(file));
                  }
                };
                
                input.click();
              }}
              className="btn-primary px-8 py-4 rounded-xl"
              style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}
            >
              + Add Photos
            </motion.button>
          </motion.div>
        </div>

        {/* Reset Modal */}
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'var(--overlay-dark)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-elevated rounded-3xl p-8 max-w-sm w-full"
            >
              <div className="text-center space-y-6">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reset App</h3>
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  This will reset the app to its initial state.
                </p>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReset(false)}
                    className="flex-1 btn-secondary px-4 py-3 rounded-xl"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 rounded-xl text-white"
                    style={{ backgroundColor: 'var(--error-color)' }}
                  >
                    Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-title" style={{ color: 'var(--text-primary)' }}>My Images ({photos.length})</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReset(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            title="Settings & Reset"
          >
            <span className="text-lg" style={{ color: 'var(--text-primary)' }}>⚙️</span>
          </motion.button>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="flex-1 p-4">
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              className="photo-thumbnail group cursor-pointer"
              onClick={() => handleViewPhoto(index)}
            >
              <img
                src={photo.data}
                alt={photo.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Photo number */}
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-black bg-opacity-70 text-white">
                {index + 1}
              </div>

              {/* Hover overlay with delete button */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg"
                  style={{ backgroundColor: 'var(--error-color)' }}
                >
                  <span className="text-sm">🗑️</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reset Modal */}
      {showReset && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'var(--overlay-dark)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="card-elevated rounded-3xl p-8 max-w-sm w-full"
          >
            <div className="text-center space-y-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reset App</h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                This will delete all {photos.length} photos and reset the app.
              </p>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowReset(false)}
                  className="flex-1 btn-secondary px-4 py-3 rounded-xl"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 rounded-xl text-white"
                  style={{ backgroundColor: 'var(--error-color)' }}
                >
                  Reset
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Photo Viewer
const PhotoViewer = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    // Set to the selected photo index or 0 if not set
    const selectedIndex = (window as any).currentPhotoIndex || 0;
    setCurrentIndex(selectedIndex);
  }, []);

  const currentPhoto = photos[currentIndex];

  if (!currentPhoto) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setView('photos')}
          className="btn-primary px-6 py-3 rounded-xl"
          style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}
        >
          Back to Photos
        </motion.button>
      </div>
    );
  }

  const goBack = () => setView('photos');
  const goPrevious = () => setCurrentIndex(Math.max(0, currentIndex - 1));
  const goNext = () => setCurrentIndex(Math.min(photos.length - 1, currentIndex + 1));

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <span className="text-lg" style={{ color: 'var(--text-primary)' }}>←</span>
        </motion.button>
        
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {currentIndex + 1} of {photos.length}
        </h1>
        
        <div className="w-12"></div>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative max-w-full max-h-full"
        >
          <img
            src={currentPhoto.data}
            alt={currentPhoto.name}
            className="w-full h-full object-contain select-none"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            draggable={false}
          />
        </motion.div>
      </div>

      {/* Navigation */}
      {photos.length > 1 && (
        <div className="flex items-center justify-center space-x-6 px-6 py-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors touch-button disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <span className="text-xl" style={{ color: 'var(--text-primary)' }}>←</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goNext}
            disabled={currentIndex === photos.length - 1}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors touch-button disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <span className="text-xl" style={{ color: 'var(--text-primary)' }}>→</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

// Main App
const App = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    const handleStateChange = () => forceUpdate();
    window.addEventListener('state-change', handleStateChange);
    return () => window.removeEventListener('state-change', handleStateChange);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'photos':
        return <PhotosScreen />;
      case 'viewer':
        return <PhotoViewer />;
      case 'welcome':
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default App;
