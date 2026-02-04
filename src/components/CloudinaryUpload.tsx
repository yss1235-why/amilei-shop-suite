import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

interface CloudinaryUploadProps {
  onUpload: (urls: string[]) => void;
  currentImages?: string[];
  onReorder?: (images: string[]) => void;
  onDelete?: (index: number) => void;
}

const CloudinaryUpload = ({ onUpload, currentImages = [], onReorder, onDelete }: CloudinaryUploadProps) => {
  const { settings } = useStore();
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  useEffect(() => {
    // Load Cloudinary Upload Widget script
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpload = () => {
    // Use settings from context, fallback to env vars
    const cloudName = settings?.cloudinaryCloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = settings?.cloudinaryUploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary configuration missing. Please configure in Admin Settings or .env file.');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    // @ts-ignore - Cloudinary widget is loaded via script
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: true, // Enable multiple uploads
        maxFiles: 5,
        maxFileSize: 5000000, // 5MB
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
        folder: 'amilei-products',
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Upload error:', error);
          setUploading(false);
          return;
        }

        if (result.event === 'success') {
          uploadedUrls.push(result.info.secure_url);
        }

        if (result.event === 'close') {
          if (uploadedUrls.length > 0) {
            onUpload([...currentImages, ...uploadedUrls]);
          }
          setUploading(false);
        }
      }
    );

    widget.open();
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...currentImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setDraggedIndex(index);
    onReorder?.(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDelete = (index: number) => {
    onDelete?.(index);
  };
  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleUpload}
        disabled={uploading}
        variant="outline"
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Images (Max 5)
          </>
        )}
      </Button>

      {currentImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {currentImages.length} image(s) uploaded. Drag to reorder, first image is primary.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {currentImages.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="relative aspect-square rounded-lg overflow-hidden bg-secondary cursor-move group"
              >
                {index === 0 && (
                  <div className="absolute top-1 left-1 z-10 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded">
                    Primary
                  </div>
                )}
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="absolute top-1 right-1 z-10 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

};

export default CloudinaryUpload;
