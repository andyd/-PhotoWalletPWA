import { create } from 'zustand';

export type View = 'welcome' | 'photos' | 'viewer';

interface UIStore {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  currentView: 'welcome',
  setCurrentView: (view: View) => set({ currentView: view })
}));
