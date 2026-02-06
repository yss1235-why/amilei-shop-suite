/**
 * Client-side image compression utility
 * Resizes and compresses images before upload to reduce file size
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1, default 0.9 (90%)
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1500,
    maxHeight: 1500,
    quality: 0.9, // 90% quality as requested
};

/**
 * Compresses an image file by resizing and reducing quality
 * @param file - The image file to compress
 * @param options - Compression options (maxWidth, maxHeight, quality)
 * @returns A Promise that resolves to the compressed File
 */
export const compressImage = async (
    file: File,
    options: CompressionOptions = {}
): Promise<File> => {
    const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        // If file is already small enough (<500KB) and not too large dimensions, skip compression
        if (file.size < 500 * 1024) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth! || height > maxHeight!) {
                    const ratio = Math.min(maxWidth! / width, maxHeight! / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Use better image smoothing for quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file with compressed data
                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.[^/.]+$/, '.jpg'), // Convert to .jpg
                            { type: 'image/jpeg' }
                        );

                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
    });
};

/**
 * Compresses multiple image files
 * @param files - Array of files to compress
 * @param options - Compression options
 * @returns Promise resolving to array of compressed files
 */
export const compressImages = async (
    files: File[],
    options: CompressionOptions = {}
): Promise<File[]> => {
    return Promise.all(files.map((file) => compressImage(file, options)));
};

/**
 * Formats file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};
