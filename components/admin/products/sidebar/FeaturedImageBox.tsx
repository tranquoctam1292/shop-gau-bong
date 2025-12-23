'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon } from 'lucide-react';
import { MediaPicker } from '@/components/admin/media/MediaPicker';
import type { MediaPickerValue } from '@/components/admin/media/MediaPicker';

interface FeaturedImageBoxProps {
  thumbnailId?: string; // Attachment ID
  thumbnailUrl?: string; // Thumbnail URL for display
  altText?: string; // Alt text for SEO
  onImageChange: (attachmentId: string, thumbnailUrl: string) => void;
  onImageRemove: () => void;
  onAltTextChange?: (altText: string) => void; // Callback for alt text changes
}

/**
 * Featured Image Box - Sidebar component cho featured image management
 * Features:
 * - 2 states: Empty / Has image
 * - Uses MediaPicker for media selection
 * - Save attachment_id to hidden input _thumbnail_id
 * - Remove button
 * - Thumbnail display (260px width)
 */
export function FeaturedImageBox({
  thumbnailId,
  thumbnailUrl,
  altText = '',
  onImageChange,
  onImageRemove,
  onAltTextChange,
}: FeaturedImageBoxProps) {
  const [mediaValue, setMediaValue] = useState<MediaPickerValue | undefined>();

  // Sync with props
  useEffect(() => {
    if (thumbnailId && thumbnailUrl) {
      setMediaValue({
        _id: thumbnailId,
        url: thumbnailUrl,
        name: 'Featured Image',
        type: 'image',
        thumbnail_url: thumbnailUrl,
      });
    } else {
      setMediaValue(undefined);
    }
  }, [thumbnailId, thumbnailUrl]);

  const handleChange = (value: MediaPickerValue | MediaPickerValue[] | undefined) => {
    if (!value) {
      setMediaValue(undefined);
      onImageRemove();
      return;
    }

    const selected = Array.isArray(value) ? value[0] : value;
    setMediaValue(selected);
    onImageChange(selected._id, selected.thumbnail_url || selected.url);
  };

  const hasImage = !!mediaValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Hình ảnh đại diện
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Hidden input for _thumbnail_id */}
        <input
          type="hidden"
          name="_thumbnail_id"
          value={thumbnailId || ''}
        />

        {/* MediaPicker */}
        <MediaPicker
          value={mediaValue}
          onChange={handleChange}
          multiple={false}
          type="image"
        />

        {/* Alt Text Input - Only show when image is selected */}
        {thumbnailId && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="featured-image-alt" className="text-xs font-medium">
              Văn bản thay thế (Alt Text) cho SEO
            </Label>
            <Input
              id="featured-image-alt"
              type="text"
              placeholder="Mô tả hình ảnh cho SEO (ví dụ: Gấu bông Teddy màu nâu)"
              value={altText}
              onChange={(e) => onAltTextChange?.(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Alt text giúp cải thiện SEO và khả năng tiếp cận cho người dùng khiếm thị
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
