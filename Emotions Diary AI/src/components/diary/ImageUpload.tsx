import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { upload } from '@devvai/devv-code-backend';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  currentImageUrl?: string;
  disabled?: boolean;
}

export function ImageUpload({ onImageUploaded, onImageRemoved, currentImageUrl, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImageUrl || '');
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const result = await upload.uploadFile(file);
      
      if (upload.isErrorResponse(result)) {
        throw new Error(result.errMsg);
      }

      if (result.link) {
        onImageUploaded(result.link);
        toast({
          title: 'Image uploaded',
          description: 'Your image has been attached to this entry',
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setPreview(''); // Clear preview on error
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageRemoved();
    toast({
      title: 'Image removed',
      description: 'The image has been removed from this entry',
    });
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <Card className="relative overflow-hidden">
          <img 
            src={preview} 
            alt="Diary entry attachment" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              disabled={disabled || isUploading}
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-sm">Uploading...</div>
            </div>
          )}
        </Card>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
          <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            Add a photo to capture this moment
          </p>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
            id="image-upload"
          />
          
          <label htmlFor="image-upload">
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              asChild
            >
              <span>
                {isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-1 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-1" />
                    Choose Photo
                  </>
                )}
              </span>
            </Button>
          </label>
          
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG up to 10MB
          </p>
        </div>
      )}
      
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>Uploading your image...</span>
        </div>
      )}
    </div>
  );
}