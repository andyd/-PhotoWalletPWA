import { create } from 'zustand';

export interface Photo {
  id: string;
  originalName: string;
  blob: Blob;
  order: number;
  addedAt: Date;
}

interface PhotoStore {
  photos: Photo[];
  isUploading: boolean;
  uploadProgress: number;
  
  // Actions
  addPhotos: (files: File[]) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  clearAllPhotos: () => Promise<void>;
  setUploading: (uploading: boolean) => void;
  setProgress: (progress: number) => void;
}

export const usePhotoStore = create<PhotoStore>()(
  (set, get) => ({
      photos: [],
      isUploading: false,
      uploadProgress: 0,

      addPhotos: async (files: File[]) => {
        set({ isUploading: true, uploadProgress: 0 });
        
        try {
          const newPhotos: Photo[] = [];
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length) * 100;
            set({ uploadProgress: progress });
            
            // Create photo object with proper blob validation
            let photoBlob: Blob;
            try {
              // Ensure we have a valid blob
              if (file instanceof Blob) {
                photoBlob = file;
              } else {
                // Convert to blob if needed
                photoBlob = new Blob([file], { type: (file as any).type || 'image/jpeg' });
              }
            } catch (error) {
              console.error('Error creating blob for file:', file.name, error);
              photoBlob = new Blob([''], { type: 'image/jpeg' });
            }
            
            const photo: Photo = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              originalName: file.name,
              blob: photoBlob,
              order: get().photos.length + i,
              addedAt: new Date()
            };
            
            newPhotos.push(photo);
          }
          
          // Add all photos at once
          set((state) => ({
            photos: [...state.photos, ...newPhotos],
            isUploading: false,
            uploadProgress: 100
          }));
          
          // Reset progress after a moment
          setTimeout(() => set({ uploadProgress: 0 }), 1000);
          
        } catch (error) {
          console.error('Error adding photos:', error);
          set({ isUploading: false, uploadProgress: 0 });
          throw error;
        }
      },

      removePhoto: async (id: string) => {
        set((state) => ({
          photos: state.photos.filter(photo => photo.id !== id)
        }));
      },

      clearAllPhotos: async () => {
        set({ photos: [] });
      },

      setUploading: (uploading: boolean) => {
        set({ isUploading: uploading });
      },

      setProgress: (progress: number) => {
        set({ uploadProgress: progress });
      }
    })
);
