'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, X, Plus } from 'lucide-react';
import Image from 'next/image';
import { MediaLibraryModal } from '@/components/admin/products/MediaLibraryModal';
import type { MediaItem } from '@/components/admin/products/MediaLibraryModal';

export interface MediaPickerValue {
  _id: string;
  url: string;
  name: string;
  type: string;
  thumbnail_url?: string;
}

interface MediaPickerProps {
  value?: MediaPickerValue | MediaPickerValue[];
  onChange: (value: MediaPickerValue | MediaPickerValue[] | undefined) => void;
  multiple?: boolean;
  type?: 'image' | 'video' | 'document' | 'all';
  label?: string;
  className?: string;
}

/**
 * MediaPicker Component
 * 
 * Wrapper component for easy media selection
 * Displays selected media preview and opens MediaLibraryModal
 */
export function MediaPicker({
  value,
  onChange,
  multiple = false,
  type = 'all',
  label,
  className,
}: MediaPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (items: MediaItem | MediaItem[]) => {
    const selectedItems = Array.isArray(items) ? items : [items];
    
    const mediaValues: MediaPickerValue[] = selectedItems.map((item) => ({
      _id: item.id,
      url: item.url,
      name: item.title || item.alt || 'Untitled',
      type: item.type,
      thumbnail_url: item.thumbnail_url,
    }));

    if (multiple) {
      onChange(mediaValues);
    } else {
      onChange(mediaValues[0] || undefined);
    }

    setIsModalOpen(false);
  };

  const handleRemove = (id: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((item) => item._id !== id));
    } else {
      onChange(undefined);
    }
  };

  const selectedItems: MediaPickerValue[] = multiple && Array.isArray(value) 
    ? value as MediaPickerValue[]
    : value 
      ? [value as MediaPickerValue] 
      : [];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}

      {/* Selected Media Preview */}
      {selectedItems.length > 0 && (
        <div className="mb-4">
          {multiple ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedItems.map((item) => (
                <Card key={item._id} className="relative group">
                  <CardContent className="p-2">
                    <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                      {item.type === 'image' && item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(item._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="relative group">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {selectedItems[0].type === 'image' && selectedItems[0].thumbnail_url ? (
                      <Image
                        src={selectedItems[0].thumbnail_url}
                        alt={selectedItems[0].name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedItems[0].name}</p>
                    <p className="text-sm text-gray-500 truncate">{selectedItems[0].url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(selectedItems[0]._id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Select Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {selectedItems.length > 0
          ? multiple
            ? `Thêm media (${selectedItems.length} đã chọn)`
            : 'Thay đổi media'
          : multiple
          ? 'Chọn media'
          : 'Chọn media'}
      </Button>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        mode={multiple ? 'multiple' : 'single'}
        selectedIds={selectedItems.map((item) => item._id)}
        buttonText={multiple ? 'Chèn media' : 'Chọn media'}
      />
    </div>
  );
}
