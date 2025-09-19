export type AppView = 'welcome' | 'manager' | 'viewer' | 'settings';

export interface AppError {
  message: string;
  type: 'storage' | 'network' | 'permission' | 'validation' | 'unknown';
  timestamp: Date;
  recoverable: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  gesturesSensitivity: 'low' | 'medium' | 'high';
  zoomBehavior: 'smooth' | 'instant';
  autoRotate: boolean;
  showTutorial: boolean;
  maxZoomLevel: number;
}

export interface AppState {
  currentView: AppView;
  isLoading: boolean;
  error: AppError | null;
  isOffline: boolean;
  isInstallable: boolean;
  settings: AppSettings;
}

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACapabilities {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  hasServiceWorker: boolean;
  supportsShare: boolean;
  supportsNotifications: boolean;
}

export interface ServiceWorkerState {
  isRegistered: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  error: string | null;
}

export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  previousView: AppView | null;
}

export interface UIState {
  showControls: boolean;
  isFullscreen: boolean;
  orientation: 'portrait' | 'landscape';
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}