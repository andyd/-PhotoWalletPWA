import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { usePhotoStore } from './stores/photoStore';
import { useUIStore } from './stores/uiStore';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Initialize app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Expose stores for debugging
(window as any).__ZUSTAND_STORES__ = {
  photoStore: usePhotoStore,
  uiStore: useUIStore
};

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);