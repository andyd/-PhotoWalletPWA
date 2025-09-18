import { validateImageFile } from '../utils/imageProcessing';
import { PhotoUploadError } from '../types';

export class FileHandler {
  static async handleFileSelection(): Promise<FileList | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;

      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        resolve(target.files);
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  }

  static validateFiles(files: FileList): { validFiles: File[]; errors: PhotoUploadError[] } {
    const validFiles: File[] = [];
    const errors: PhotoUploadError[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateImageFile(file);

      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push({
          type: 'file-type',
          message: validation.error!,
          fileName: file.name,
        });
      }
    });

    return { validFiles, errors };
  }

  static async requestFileSystemAccess(): Promise<boolean> {
    if ('showOpenFilePicker' in window) {
      try {
        const fileHandles = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Images',
              accept: {
                'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp'],
              },
            },
          ],
          multiple: true,
        });

        return fileHandles.length > 0;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return false;
        }
        throw error;
      }
    }
    return false;
  }

  static isFileSystemAccessSupported(): boolean {
    return 'showOpenFilePicker' in window;
  }

  static createBlobURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  static revokeBlobURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}