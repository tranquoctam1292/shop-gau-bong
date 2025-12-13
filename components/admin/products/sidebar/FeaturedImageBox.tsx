'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import { MediaPicker } from '@/components/admin/media/MediaPicker';
import type { MediaPickerValue } from '@/components/admin/media/MediaPicker';

interface FeaturedImageBoxProps {
  thumbnailId?: string; // Attachment ID
  thumbnailUrl?: string; // Thumbnail URL for display
  onImageChange: (attachmentId: string, thumbnailUrl: string) => void;
  onImageRemove: () => void;
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
  onImageChange,
  onImageRemove,
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
      </CardContent>
    </Card>
  );
}
