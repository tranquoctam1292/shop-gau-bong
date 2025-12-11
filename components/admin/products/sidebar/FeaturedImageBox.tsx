'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';

interface FeaturedImageBoxProps {
  featuredImage?: string; // First image in images array
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
}

/**
 * Featured Image Box - Sidebar component cho featured image management
 * Features:
 * - Image preview
 * - Upload/Change button (URL input)
 * - Remove button
 * - Placeholder khi chưa có image
 */
export function FeaturedImageBox({
  featuredImage,
  onImageChange,
  onImageRemove,
}: FeaturedImageBoxProps) {
  const [imageUrl, setImageUrl] = useState(featuredImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onImageChange(imageUrl.trim());
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // For now, convert to data URL (in production, upload to server)
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onImageChange(dataUrl);
        setImageUrl(dataUrl);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Có lỗi xảy ra khi đọc file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Có lỗi xảy ra khi upload hình ảnh');
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onImageRemove();
    setImageUrl('');
  };

  const currentImage = featuredImage || imageUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Hình ảnh đại diện
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Preview */}
        {currentImage ? (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-muted">
            <img
              src={currentImage}
              alt="Featured"
              className="w-full h-full object-cover"
              onError={() => {
                alert('Không thể tải hình ảnh. Vui lòng kiểm tra URL.');
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Chưa có hình ảnh</p>
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
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={isUploading || !imageUrl.trim()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {currentImage ? 'Thay đổi' : 'Thêm hình ảnh'}
          </Button>
        </div>

        {/* File Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Đang upload...' : 'Upload từ máy tính'}
          </Button>
        </div>

        {/* Remove Button */}
        {currentImage && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Xóa hình ảnh
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
