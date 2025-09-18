import React, { createContext, useContext, ReactNode } from 'react';
import { AppView, Photo } from '../types';

interface AppContextType {
  currentView: AppView;
  photos: Photo[];
  currentPhotoIndex: number;
  isLoading: boolean;
  error: any;
  isInstallable: boolean;
  isOffline: boolean;
  actions: {
    goToSetup: () => void;
    goToHome: () => void;
    goToSlide: (index: number) => void;
    setCurrentPhotoIndex: (index: number) => void;
    clearError: () => void;
    setInstallable: (isInstallable: boolean) => void;
    addPhotos: (files: File[]) => Promise<void>;
    removePhoto: (id: string) => void;
    reorderPhotos: (fromIndex: number, toIndex: number) => void;
    clearAllPhotos: () => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  value: AppContextType;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, value }) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
