import { validateImageFile } from '../utils/validators';
import { ERROR_MESSAGES, SUPPORTED_IMAGE_TYPES } from '../utils/constants';

export interface FileDropEvent {
  files: File[];
  position: { x: number; y: number };
}

export interface FileSelectionOptions {
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
}

export interface FileProcessingResult {
  validFiles: File[];
  invalidFiles: Array<{ file: File; error: string }>;
}

export class FileHandlerService {
  // Handle file input selection
  static async selectFiles(options: FileSelectionOptions = {}): Promise<File[]> {
    const {
      multiple = true,
      accept = SUPPORTED_IMAGE_TYPES.join(','),
      maxFiles = 100,
    } = options;

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      input.accept = accept;
      input.style.display = 'none';

      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const files = Array.from(target.files || []);

        // Limit number of files
        const limitedFiles = files.slice(0, maxFiles);

        document.body.removeChild(input);
        resolve(limitedFiles);
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        resolve([]);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  // Process drag and drop events
  static handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  static handleDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  static handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  static handleDrop = async (event: DragEvent): Promise<FileDropEvent> => {
    event.preventDefault();
    event.stopPropagation();

    const files: File[] = [];
    const position = { x: event.clientX, y: event.clientY };

    if (event.dataTransfer) {
      // Handle dropped files
      if (event.dataTransfer.files.length > 0) {
        files.push(...Array.from(event.dataTransfer.files));
      }

      // Handle dropped items (for better browser support)
      if (event.dataTransfer.items) {
        const items = Array.from(event.dataTransfer.items);
        for (const item of items) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }
      }
    }

    return { files, position };
  };

  // Validate and process multiple files
  static processFiles(files: File[]): FileProcessingResult {
    const validFiles: File[] = [];
    const invalidFiles: Array<{ file: File; error: string }> = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          file,
          error: validation.error || ERROR_MESSAGES.UNKNOWN_ERROR,
        });
      }
    }

    return { validFiles, invalidFiles };
  }

  // Set up drag and drop zone
  static setupDropZone(
    element: HTMLElement,
    onDrop: (event: FileDropEvent) => void,
    onDragStateChange?: (isDragging: boolean) => void
  ): () => void {
    let dragCounter = 0;

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounter++;

      if (onDragStateChange && dragCounter === 1) {
        onDragStateChange(true);
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounter--;

      if (onDragStateChange && dragCounter === 0) {
        onDragStateChange(false);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounter = 0;

      if (onDragStateChange) {
        onDragStateChange(false);
      }

      const dropEvent = await FileHandlerService.handleDrop(event);
      onDrop(dropEvent);
    };

    // Add event listeners
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    // Return cleanup function
    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }

  // Handle paste events (for pasting images from clipboard)
  static handlePaste = async (event: ClipboardEvent): Promise<File[]> => {
    const files: File[] = [];

    if (event.clipboardData) {
      const items = Array.from(event.clipboardData.items);

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
    }

    return files;
  };

  // Set up global paste handler
  static setupPasteHandler(
    onPaste: (files: File[]) => void
  ): () => void {
    const handlePaste = async (event: ClipboardEvent) => {
      const files = await FileHandlerService.handlePaste(event);
      if (files.length > 0) {
        onPaste(files);
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }

  // Convert File to data URL for preview
  static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsDataURL(file);
    });
  }

  // Convert File to array buffer
  static fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as array buffer'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Check if file is an image by reading its header
  static async isImageFile(file: File): Promise<boolean> {
    try {
      const buffer = await this.fileToArrayBuffer(file.slice(0, 12));
      const bytes = new Uint8Array(buffer);

      // Check common image file signatures
      const signatures = [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0x52, 0x49, 0x46, 0x46], // WebP (RIFF)
        [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // HEIC/HEIF
      ];

      return signatures.some(signature =>
        signature.every((byte, index) => bytes[index] === byte)
      );
    } catch {
      return false;
    }
  }

  // Get file extension
  static getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
  }

  // Generate safe filename
  static generateSafeFilename(originalName: string): string {
    const name = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const extension = this.getFileExtension(name);
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;

    return `${nameWithoutExt}_${timestamp}${extension}`;
  }
}