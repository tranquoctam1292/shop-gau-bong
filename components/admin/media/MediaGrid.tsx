'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Image as ImageIcon, Video, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';

export interface MediaGridItem {
  _id: string;
  name: string;
  url: string;
  thumbnail_url?: string;
  type: 'image' | 'video' | 'document' | 'other';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
  createdAt: string;
}

interface MediaGridProps {
  items: MediaGridItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onItemClick?: (item: MediaGridItem) => void;
  loading?: boolean;
  multiple?: boolean;
  className?: string;
}

/**
 * MediaGrid Component
 * 
 * Grid layout for displaying media items with lazy loading
 * Supports single and multiple selection
 */
export function MediaGrid({
  items,
  selectedIds,
  onSelect,
  onDeselect,
  onItemClick,
  loading = false,
  multiple = false,
  className,
}: MediaGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  }, []);

  const handleItemClick = (item: MediaGridItem) => {
    if (multiple) {
      if (selectedIds.includes(item._id)) {
        onDeselect(item._id);
      } else {
        onSelect(item._id);
      }
    } else {
      onSelect(item._id);
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-gray-400" />;
      case 'video':
        return <Video className="h-8 w-8 text-gray-400" />;
      case 'document':
        return <File className="h-8 w-8 text-gray-400" />;
      default:
        return <File className="h-8 w-8 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Không có media nào</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4',
        className
      )}
    >
      {items.map((item) => {
        const isSelected = selectedIds.includes(item._id);
        const isImage = item.type === 'image';
        const thumbnailUrl = item.thumbnail_url || item.url;

        return (
          <Card
            key={item._id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isSelected && 'ring-2 ring-primary',
              !isImage && 'aspect-square'
            )}
            onClick={() => handleItemClick(item)}
          >
            <CardContent className="p-2 relative">
              {/* Selection Checkbox */}
              {multiple && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelect(item._id);
                      } else {
                        onDeselect(item._id);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Thumbnail/Preview */}
              <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                {isImage ? (
                  <>
                    {!loadedImages.has(item._id) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    )}
                    <Image
                      src={thumbnailUrl}
                      alt={item.altText || item.name}
                      fill
                      className={cn(
                        'object-cover transition-opacity',
                        loadedImages.has(item._id) ? 'opacity-100' : 'opacity-0'
                      )}
                      onLoad={() => handleImageLoad(item._id)}
                      loading="lazy"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {getFileIcon(item.type)}
                    <span className="text-xs text-gray-500 mt-2 text-center px-2 truncate w-full">
                      {item.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-2 px-1">
                <p className="text-xs font-medium truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.size)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
