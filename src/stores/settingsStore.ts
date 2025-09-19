import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { photoStorageService } from '../services/photoStorage';
import type { AppSettings, StoredSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/constants';

interface SettingsState extends AppSettings {
  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  setTheme: (theme: 'dark' | 'light' | 'auto') => Promise<void>;
  setGesturesSensitivity: (sensitivity: 'low' | 'medium' | 'high') => Promise<void>;
  setZoomBehavior: (behavior: 'smooth' | 'instant') => Promise<void>;
  setAutoRotate: (enabled: boolean) => Promise<void>;
  setShowTutorial: (show: boolean) => Promise<void>;
  setMaxZoomLevel: (level: number) => Promise<void>;
  clearError: () => void;

  // Computed values
  getThemeMode: () => 'dark' | 'light';
  getGestureSensitivityValue: () => number;
  getAnimationDuration: () => number;

  // Private helpers
  applyTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state from defaults
        ...DEFAULT_SETTINGS,
        isLoading: false,
        error: null,

        // Actions
        loadSettings: async () => {
          try {
            set({ isLoading: true, error: null });

            const storedSettings = await photoStorageService.getSettings();

            set({
              theme: storedSettings.theme,
              gesturesSensitivity: storedSettings.gesturesSensitivity,
              zoomBehavior: storedSettings.zoomBehavior,
              autoRotate: storedSettings.autoRotate,
              showTutorial: storedSettings.showTutorial,
              maxZoomLevel: storedSettings.maxZoomLevel,
              isLoading: false,
            });

            // Apply theme to document
            get().applyTheme();
          } catch (error) {
            console.error('Failed to load settings:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to load settings',
            });
          }
        },

        updateSettings: async (newSettings: Partial<AppSettings>) => {
          try {
            set({ isLoading: true, error: null });

            // Update local state
            const currentSettings = get();
            const updatedSettings = {
              theme: newSettings.theme ?? currentSettings.theme,
              gesturesSensitivity: newSettings.gesturesSensitivity ?? currentSettings.gesturesSensitivity,
              zoomBehavior: newSettings.zoomBehavior ?? currentSettings.zoomBehavior,
              autoRotate: newSettings.autoRotate ?? currentSettings.autoRotate,
              showTutorial: newSettings.showTutorial ?? currentSettings.showTutorial,
              maxZoomLevel: newSettings.maxZoomLevel ?? currentSettings.maxZoomLevel,
            };

            set({
              ...updatedSettings,
              isLoading: false,
            });

            // Persist to storage
            await photoStorageService.updateSettings(updatedSettings);

            // Apply visual changes if needed
            if (newSettings.theme) {
              get().applyTheme();
            }
          } catch (error) {
            console.error('Failed to update settings:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to update settings',
            });
          }
        },

        resetSettings: async () => {
          try {
            set({ isLoading: true, error: null });

            await photoStorageService.updateSettings(DEFAULT_SETTINGS);

            set({
              ...DEFAULT_SETTINGS,
              isLoading: false,
            });

            get().applyTheme();
          } catch (error) {
            console.error('Failed to reset settings:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to reset settings',
            });
          }
        },

        setTheme: async (theme: 'dark' | 'light' | 'auto') => {
          await get().updateSettings({ theme });
        },

        setGesturesSensitivity: async (sensitivity: 'low' | 'medium' | 'high') => {
          await get().updateSettings({ gesturesSensitivity: sensitivity });
        },

        setZoomBehavior: async (behavior: 'smooth' | 'instant') => {
          await get().updateSettings({ zoomBehavior: behavior });
        },

        setAutoRotate: async (enabled: boolean) => {
          await get().updateSettings({ autoRotate: enabled });
        },

        setShowTutorial: async (show: boolean) => {
          await get().updateSettings({ showTutorial: show });
        },

        setMaxZoomLevel: async (level: number) => {
          const clampedLevel = Math.max(1, Math.min(5, level));
          await get().updateSettings({ maxZoomLevel: clampedLevel });
        },

        clearError: () => {
          set({ error: null });
        },

        // Computed values
        getThemeMode: () => {
          const { theme } = get();

          if (theme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }

          return theme;
        },

        getGestureSensitivityValue: () => {
          const { gesturesSensitivity } = get();

          switch (gesturesSensitivity) {
            case 'low':
              return 0.5;
            case 'high':
              return 2.0;
            default:
              return 1.0;
          }
        },

        getAnimationDuration: () => {
          const { zoomBehavior } = get();
          return zoomBehavior === 'instant' ? 0 : 300;
        },

        // Private helper methods
        applyTheme: () => {
          const mode = get().getThemeMode();
          const root = document.documentElement;

          if (mode === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
          } else {
            root.classList.add('light');
            root.classList.remove('dark');
          }

          // Update meta theme-color
          const metaThemeColor = document.querySelector('meta[name="theme-color"]');
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', mode === 'dark' ? '#000000' : '#ffffff');
          }
        },
      }),
      {
        name: 'settings-store',
        partialize: (state) => ({
          theme: state.theme,
          gesturesSensitivity: state.gesturesSensitivity,
          zoomBehavior: state.zoomBehavior,
          autoRotate: state.autoRotate,
          showTutorial: state.showTutorial,
          maxZoomLevel: state.maxZoomLevel,
        }),
      }
    ),
    {
      name: 'settings-store',
    }
  )
);

// Set up auto theme detection
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleThemeChange = () => {
    const store = useSettingsStore.getState();
    if (store.theme === 'auto') {
      store.applyTheme();
    }
  };

  mediaQuery.addEventListener('change', handleThemeChange);
}