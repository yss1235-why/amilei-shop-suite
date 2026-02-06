import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { toast } from 'sonner';

interface CloudinaryUploadProps {
  onUpload: (urls: string[]) => void;
  currentImages?: string[];
  onReorder?: (images: string[]) => void;
  onDelete?: (index: number) => void;
  maxFiles?: number;
  renderTrigger?: (onClick: () => void, uploading: boolean) => React.ReactNode;
}

const CloudinaryUpload = ({
  onUpload,
  currentImages = [],
  onReorder,
  onDelete,
  maxFiles = 5,
  renderTrigger
}: CloudinaryUploadProps) => {
  const { settings } = useStore();
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = settings?.cloudinaryCloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = settings?.cloudinaryUploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing. Please configure in Admin Settings or .env file.');
    }

    // Generate dynamic folder name from store name
    const storeName = settings?.storeName || 'store';
    const folderName = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-products';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folderName);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit number of files
    const remainingSlots = maxFiles - currentImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(`Only uploading ${remainingSlots} image(s). Maximum ${maxFiles} images allowed.`);
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        // Compress image before upload
        const originalSize = file.size;
        const compressedFile = await compressImage(file);
        const compressedSize = compressedFile.size;

        // Log compression stats (optional, for debugging)
        if (originalSize !== compressedSize) {
          console.log(
            `Compressed ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)}`
          );
        }

        // Upload to Cloudinary
        const url = await uploadToCloudinary(compressedFile);
        uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        onUpload([...currentImages, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

  // Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      multiple={maxFiles > 1}
      onChange={handleFileChange}
      className="hidden"
    />
  );

  // If a custom trigger is provided, use it; otherwise, render the default button
  if (renderTrigger) {
    return (
      <>
        {fileInput}
        {renderTrigger(handleClick, uploading)}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {fileInput}
      <Button
        type="button"
        onClick={handleClick}
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
            Choose Images (Max {maxFiles})
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
