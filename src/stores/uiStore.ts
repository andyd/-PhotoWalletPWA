import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  AppView,
  AppError,
  PWACapabilities,
  ServiceWorkerState,
  NavigationState,
  UIState,
  InstallPromptEvent,
} from '../types';
import { getDeviceInfo } from '../utils/helpers';

interface AppUIState {
  // Navigation state
  currentView: AppView;
  previousView: AppView | null;
  navigationState: NavigationState;

  // UI state
  ui: UIState;

  // App state
  isInitialized: boolean;
  isOffline: boolean;
  globalError: AppError | null;

  // PWA state
  pwaCapabilities: PWACapabilities;
  serviceWorker: ServiceWorkerState;
  installPrompt: InstallPromptEvent | null;

  // Toast/notification state
  toasts: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    timestamp: Date;
  }>;

  // Actions
  setCurrentView: (view: AppView) => void;
  goBack: () => void;
  goForward: () => void;
  initialize: () => Promise<void>;
  setOfflineStatus: (isOffline: boolean) => void;
  setGlobalError: (error: AppError | null) => void;
  updatePWACapabilities: () => void;
  updateServiceWorkerState: (state: Partial<ServiceWorkerState>) => void;
  setInstallPrompt: (prompt: InstallPromptEvent | null) => void;
  showInstallPrompt: () => Promise<boolean>;
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  toggleFullscreen: () => void;
  setControlsVisibility: (visible: boolean) => void;
  updateSafeArea: () => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
}

export const useUIStore = create<AppUIState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentView: 'welcome',
      previousView: null,
      navigationState: {
        canGoBack: false,
        canGoForward: false,
        previousView: null,
      },

      ui: {
        showControls: true,
        isFullscreen: false,
        orientation: 'portrait',
        safeArea: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },

      isInitialized: false,
      isOffline: false,
      globalError: null,

      pwaCapabilities: {
        canInstall: false,
        isInstalled: false,
        isStandalone: false,
        hasServiceWorker: false,
        supportsShare: false,
        supportsNotifications: false,
      },

      serviceWorker: {
        isRegistered: false,
        isUpdating: false,
        hasUpdate: false,
        error: null,
      },

      installPrompt: null,
      toasts: [],

      // Actions
      setCurrentView: (view: AppView) => {
        const currentView = get().currentView;

        set({
          previousView: currentView,
          currentView: view,
          navigationState: {
            canGoBack: true,
            canGoForward: false,
            previousView: currentView,
          },
        });
      },

      goBack: () => {
        const { previousView, navigationState } = get();

        if (navigationState.canGoBack && previousView) {
          set({
            currentView: previousView,
            previousView: null,
            navigationState: {
              canGoBack: false,
              canGoForward: true,
              previousView: null,
            },
          });
        }
      },

      goForward: () => {
        const { navigationState } = get();

        if (navigationState.canGoForward && navigationState.previousView) {
          get().setCurrentView(navigationState.previousView);
        }
      },

      initialize: async () => {
        try {
          // Update PWA capabilities
          get().updatePWACapabilities();

          // Update safe area
          get().updateSafeArea();

          // Set up network status listeners
          const updateOnlineStatus = () => {
            get().setOfflineStatus(!navigator.onLine);
          };

          window.addEventListener('online', updateOnlineStatus);
          window.addEventListener('offline', updateOnlineStatus);
          updateOnlineStatus();

          // Set up orientation listener
          const updateOrientation = () => {
            const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
            get().setOrientation(orientation);
          };

          window.addEventListener('resize', updateOrientation);
          window.addEventListener('orientationchange', updateOrientation);
          updateOrientation();

          // Set up install prompt listener
          window.addEventListener('beforeinstallprompt', (e: Event) => {
            e.preventDefault();
            get().setInstallPrompt(e as InstallPromptEvent);
          });

          // Check if app is installed
          window.addEventListener('appinstalled', () => {
            get().updatePWACapabilities();
            get().setInstallPrompt(null);
          });

          set({ isInitialized: true });
        } catch (error) {
          console.error('Failed to initialize UI store:', error);
        }
      },

      setOfflineStatus: (isOffline: boolean) => {
        set({ isOffline });

        if (isOffline) {
          get().addToast('You are offline. The app will continue to work.', 'warning');
        }
      },

      setGlobalError: (error: AppError | null) => {
        set({ globalError: error });

        if (error) {
          get().addToast(error.message, 'error');
        }
      },

      updatePWACapabilities: () => {
        const deviceInfo = getDeviceInfo();

        const capabilities: PWACapabilities = {
          canInstall: 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window,
          isInstalled: window.matchMedia('(display-mode: standalone)').matches,
          isStandalone: (window.navigator as any).standalone === true ||
                       window.matchMedia('(display-mode: standalone)').matches,
          hasServiceWorker: 'serviceWorker' in navigator,
          supportsShare: 'share' in navigator,
          supportsNotifications: 'Notification' in window,
        };

        set({ pwaCapabilities: capabilities });
      },

      updateServiceWorkerState: (state: Partial<ServiceWorkerState>) => {
        set({
          serviceWorker: {
            ...get().serviceWorker,
            ...state,
          },
        });
      },

      setInstallPrompt: (prompt: InstallPromptEvent | null) => {
        set({ installPrompt: prompt });

        if (prompt) {
          get().addToast('Install Photo Wallet for a better experience', 'info', 5000);
        }
      },

      showInstallPrompt: async () => {
        const { installPrompt } = get();

        if (!installPrompt) {
          return false;
        }

        try {
          await installPrompt.prompt();
          const choiceResult = await installPrompt.userChoice;

          if (choiceResult.outcome === 'accepted') {
            get().setInstallPrompt(null);
            get().addToast('App installed successfully!', 'success');
            return true;
          } else {
            get().addToast('Installation cancelled', 'info');
            return false;
          }
        } catch (error) {
          console.error('Error showing install prompt:', error);
          get().addToast('Installation failed', 'error');
          return false;
        }
      },

      addToast: (message: string, type = 'info' as const, duration = 3000) => {
        const toast = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          message,
          type,
          duration,
          timestamp: new Date(),
        };

        set({ toasts: [...get().toasts, toast] });

        // Auto-remove toast after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(toast.id);
          }, duration);
        }
      },

      removeToast: (id: string) => {
        set({
          toasts: get().toasts.filter(toast => toast.id !== id),
        });
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      toggleFullscreen: () => {
        const isFullscreen = get().ui.isFullscreen;

        if (!isFullscreen && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (isFullscreen && document.exitFullscreen) {
          document.exitFullscreen();
        }

        set({
          ui: {
            ...get().ui,
            isFullscreen: !isFullscreen,
          },
        });
      },

      setControlsVisibility: (visible: boolean) => {
        set({
          ui: {
            ...get().ui,
            showControls: visible,
          },
        });
      },

      updateSafeArea: () => {
        const safeArea = {
          top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0'),
          right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0'),
          bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0'),
          left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0'),
        };

        set({
          ui: {
            ...get().ui,
            safeArea,
          },
        });
      },

      setOrientation: (orientation: 'portrait' | 'landscape') => {
        set({
          ui: {
            ...get().ui,
            orientation,
          },
        });
      },
    })),
    {
      name: 'ui-store',
      partialize: (state: any) => ({
        currentView: state.currentView,
        ui: state.ui,
      }),
    }
  )
);