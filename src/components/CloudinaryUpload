import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

const CloudinaryUpload = ({ onUpload, currentImage }: CloudinaryUploadProps) => {
  const [uploading, setUploading] = useState(false);

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
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary configuration missing');
      return;
    }

    setUploading(true);

    // @ts-ignore - Cloudinary widget is loaded via script
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
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
          onUpload(result.info.secure_url);
          setUploading(false);
        }

        if (result.event === 'close') {
          setUploading(false);
        }
      }
    );

    widget.open();
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
            Upload Image
          </>
        )}
      </Button>

      {currentImage && (
        <div className="relative aspect-square w-full max-w-xs rounded-lg overflow-hidden bg-secondary">
          <img
            src={currentImage}
            alt="Product preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
