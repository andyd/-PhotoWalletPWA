import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple in-memory stores with localStorage persistence
let photos: Array<{id: string, name: string, data: string}> = [];
let currentView = 'welcome';

// Load state from localStorage on startup
const loadState = () => {
  try {
    const savedPhotos = localStorage.getItem('photoWallet_photos');
    const savedView = localStorage.getItem('photoWallet_currentView');
    
    if (savedPhotos) {
      photos = JSON.parse(savedPhotos);
    }
    
    // If we have photos, always go to photos view regardless of saved view
    if (photos.length > 0) {
      currentView = 'photos';
    } else if (savedView) {
      currentView = savedView;
    }
  } catch (error) {
    console.log('Could not load saved state:', error);
  }
};

// Save state to localStorage
const saveState = () => {
  try {
    localStorage.setItem('photoWallet_photos', JSON.stringify(photos));
    localStorage.setItem('photoWallet_currentView', currentView);
  } catch (error) {
    console.log('Could not save state:', error);
  }
};

// Load state immediately
loadState();

// Simple store functions
const addPhoto = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    if (result) {
      photos.push({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        data: result
      });
      currentView = 'photos';
      saveState();
      console.log('Photo added, current view:', currentView, 'photos count:', photos.length);
      // Trigger re-render
      window.dispatchEvent(new Event('state-change'));
    }
  };
  reader.onerror = () => {
    console.error('Error reading file:', file.name);
  };
  reader.readAsDataURL(file);
};

const removePhoto = (id: string) => {
  photos = photos.filter(p => p.id !== id);
  saveState();
  window.dispatchEvent(new Event('state-change'));
};

const setView = (view: string) => {
  currentView = view;
  saveState();
  window.dispatchEvent(new Event('state-change'));
};

const clearAllData = () => {
  photos = [];
  currentView = 'welcome';
  localStorage.removeItem('photoWallet_photos');
  localStorage.removeItem('photoWallet_currentView');
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
  const handleViewPhoto = (index: number) => {
    // Set the current photo index before switching to viewer
    (window as any).currentPhotoIndex = index;
    setView('viewer');
  };

  const handleDeletePhoto = (id: string) => {
    removePhoto(id);
  };

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h1 className="text-title" style={{ color: 'var(--text-primary)' }}>My Photos (0)</h1>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('settings')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            title="Settings"
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

      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h1 className="text-title" style={{ color: 'var(--text-primary)' }}>My Photos ({photos.length})</h1>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('settings')}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
          title="Settings"
        >
          <span className="text-lg" style={{ color: 'var(--text-primary)' }}>⚙️</span>
        </motion.button>
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

    </div>
  );
};

// Settings Screen
const SettingsScreen = () => {
  const handleResetApp = () => {
    clearAllData();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('photos')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors touch-button"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              minHeight: '48px',
              minWidth: '48px'
            }}
            title="Back to Photos"
          >
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>←</span>
          </motion.button>
          <h1 className="text-title" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-8">
          {/* App Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <span className="text-4xl">📷</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Photo Wallet</h2>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Your important photos at your fingertips</p>
            </div>
          </motion.div>

          {/* Photo Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card rounded-2xl p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Photos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Total Photos</span>
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{photos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Storage Used</span>
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Local</span>
              </div>
            </div>
          </motion.div>

          {/* Reset Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card rounded-2xl p-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Reset App</h3>
            <p className="text-body mb-6" style={{ color: 'var(--text-secondary)' }}>
              This will delete all {photos.length} photos and reset the app to its initial state. This action cannot be undone.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResetApp}
              className="w-full px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center"
              style={{ 
                backgroundColor: 'var(--error-color)',
                minHeight: '48px',
                fontSize: '16px',
                lineHeight: '1.5'
              }}
            >
              Reset App
            </motion.button>
          </motion.div>

          {/* Privacy Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Privacy First</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your photos are stored locally on your device and never leave your phone.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Photo Viewer - Clean image display with invisible navigation
const PhotoViewer = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const goPrevious = () => setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
  const goNext = () => setCurrentIndex(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
  const goBack = () => setView('photos');

  React.useEffect(() => {
    // Set to the selected photo index or 0 if not set
    const selectedIndex = (window as any).currentPhotoIndex || 0;
    setCurrentIndex(selectedIndex);

    // Add keyboard event listeners for navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setView('photos');
          break;
        case 'ArrowLeft':
          setCurrentIndex((prev) => prev === 0 ? photos.length - 1 : prev - 1);
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1);
          break;
        case ' ':
          e.preventDefault();
          setCurrentIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [photos.length]);

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

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative" 
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Clean image display - no visible UI elements */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full flex items-center justify-center"
      >
        <img
          src={currentPhoto.data}
          alt={currentPhoto.name}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: 'contain'
          }}
          draggable={false}
          onClick={(e) => {
            // Click left side to go previous, right side to go next
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const imageWidth = rect.width;
            
            if (photos.length > 1) {
              if (clickX < imageWidth / 2) {
                setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
              } else {
                setCurrentIndex(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
              }
            }
          }}
        />
      </motion.div>

      {/* Invisible navigation areas - full screen coverage */}
      {photos.length > 1 && (
        <>
          {/* Left side - Previous */}
          <div
            className="absolute left-0 top-0 w-1/2 h-full cursor-pointer"
            onClick={() => setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1)}
            style={{ zIndex: 1 }}
            title="Previous (or press ←)"
          />
          
          {/* Right side - Next */}
          <div
            className="absolute right-0 top-0 w-1/2 h-full cursor-pointer"
            onClick={() => setCurrentIndex(currentIndex === photos.length - 1 ? 0 : currentIndex + 1)}
            style={{ zIndex: 1 }}
            title="Next (or press →)"
          />
        </>
      )}

      {/* Invisible back button - top left corner */}
      <div
        className="absolute top-0 left-0 w-16 h-16 cursor-pointer"
        onClick={goBack}
        style={{ zIndex: 2 }}
        title="Back to Photos (or press Escape)"
      />
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
      case 'settings':
        return <SettingsScreen />;
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
