'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Upload, X, GripVertical, Star } from 'lucide-react';

interface ProductGalleryBoxProps {
  images: string[];
  featuredImageIndex?: number; // Index of featured image (usually 0)
  onImagesChange: (images: string[]) => void;
  onSetFeatured?: (index: number) => void;
}

/**
 * Product Gallery Box - Sidebar component cho product gallery management
 * Features:
 * - Gallery grid (2x2 or 3x3)
 * - Add images (URL or file upload)
 * - Remove images
 * - Reorder images (drag & drop)
 * - Set featured image
 */
export function ProductGalleryBox({
  images,
  featuredImageIndex = 0,
  onImagesChange,
  onSetFeatured,
}: ProductGalleryBoxProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = () => {
    if (imageUrl.trim() && !images.includes(imageUrl.trim())) {
      onImagesChange([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} không phải là hình ảnh`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} vượt quá 5MB`);
        continue;
      }

      try {
        // Convert to data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newImages.push(dataUrl);
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSetFeatured = (index: number) => {
    if (onSetFeatured) {
      onSetFeatured(index);
    } else {
      // Move image to first position
      const newImages = [...images];
      const [featuredImage] = newImages.splice(index, 1);
      newImages.unshift(featuredImage);
      onImagesChange(newImages);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Thư viện hình ảnh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gallery Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative aspect-square group rounded-lg overflow-hidden border-2 border-muted cursor-move"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <img
                  src={img}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error(`Failed to load image at index ${index}`);
                  }}
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Drag handle */}
                  <div className="text-white">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Set Featured Button */}
                  {index !== featuredImageIndex && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetFeatured(index)}
                      className="h-8"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Đặt làm ảnh đại diện
                    </Button>
                  )}

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="h-8"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Featured Badge */}
                {index === featuredImageIndex && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Đại diện
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-square rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Chưa có hình ảnh</p>
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Nhập URL hình ảnh"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!imageUrl.trim()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Thêm hình ảnh
          </Button>
        </div>

        {/* File Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload nhiều hình ảnh
          </Button>
        </div>

        {/* Info */}
        {images.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {images.length} hình ảnh • Kéo thả để sắp xếp
          </p>
        )}
      </CardContent>
    </Card>
  );
}
