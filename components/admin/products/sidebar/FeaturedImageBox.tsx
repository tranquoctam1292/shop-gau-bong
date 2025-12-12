'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, X } from 'lucide-react';
import { MediaLibraryModal, type MediaItem } from '../MediaLibraryModal';

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
 * - Click to open Media Modal (single select)
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
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | undefined>(thumbnailUrl);

  // Sync with prop changes
  useEffect(() => {
    setCurrentThumbnailUrl(thumbnailUrl);
  }, [thumbnailUrl]);

  const handleMediaSelect = (items: MediaItem | MediaItem[]) => {
    // In single mode, onSelect returns a single MediaItem
    const selectedItem = Array.isArray(items) ? items[0] : items;
    const thumbUrl = selectedItem.thumbnail_url || selectedItem.url;
    setCurrentThumbnailUrl(thumbUrl);
    onImageChange(selectedItem.id, thumbUrl);
    setShowMediaModal(false);
  };

  const handleRemove = () => {
    setCurrentThumbnailUrl(undefined);
    onImageRemove();
  };

  const hasImage = !!currentThumbnailUrl && !!thumbnailId;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Hình ảnh đại diện
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hidden input for _thumbnail_id */}
          <input
            type="hidden"
            name="_thumbnail_id"
            value={thumbnailId || ''}
          />

          {/* Image Preview - State A: Has Image */}
          {hasImage ? (
            <div className="space-y-3">
              <div 
                className="relative w-full rounded-lg overflow-hidden border-2 border-muted cursor-pointer hover:border-primary transition-colors"
                style={{ width: '260px', aspectRatio: '1' }}
                onClick={() => setShowMediaModal(true)}
              >
                <img
                  src={currentThumbnailUrl}
                  alt="Featured"
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error('Failed to load featured image');
                    // Optionally show error state
                  }}
                />
              </div>
              
              {/* Remove link */}
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-destructive hover:underline"
              >
                Xóa ảnh sản phẩm
              </button>
            </div>
          ) : (
            /* State B: Empty */
            <div className="space-y-3">
              <div 
                className="w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/50"
                style={{ width: '260px', aspectRatio: '1' }}
              >
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Chưa có hình ảnh</p>
                </div>
              </div>
              
              {/* Set image button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMediaModal(true)}
                className="w-full"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Thiết lập ảnh sản phẩm
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
        mode="single"
        buttonText="Thiết lập ảnh sản phẩm"
      />
    </>
  );
}
