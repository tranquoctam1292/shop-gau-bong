'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaLibraryModal, type MediaItem } from '../MediaLibraryModal';

interface GalleryImage {
  id: string; // Attachment ID
  thumbnail_url: string; // Thumbnail URL for display
  title?: string; // Image title for tooltip
  altText?: string; // Alt text for SEO
}

interface ProductGalleryBoxProps {
  galleryImages?: GalleryImage[]; // Array of {id, thumbnail_url, title, altText}
  onImagesChange: (images: GalleryImage[]) => void;
  onAltTextChange?: (imageId: string, altText: string) => void; // Callback for alt text changes
}

/**
 * Sortable Gallery Item Component
 */
function SortableGalleryItem({ 
  image, 
  onRemove 
}: { 
  image: GalleryImage; 
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, width: '80px', height: '80px' }}
      className="relative group rounded-lg overflow-hidden border-2 border-muted cursor-move"
      title={image.title || `Image ${image.id}`}
    >
      <div className="relative w-full h-full">
        <Image
          src={image.thumbnail_url}
          alt={image.title || `Gallery ${image.id}`}
          fill
          className="object-cover"
          sizes="80px"
          onError={() => {
            console.error(`Failed to load gallery image: ${image.id}`);
          }}
        />
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-white cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Quick Remove Button */}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="h-8"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Product Gallery Box - Sidebar component cho product gallery management
 * Features:
 * - Grid layout với thumbnails 80x80px
 * - Multi-select trong Media Modal
 * - Drag & Drop để sắp xếp
 * - Quick remove button (hover)
 * - Tooltip với tên file
 * - Hidden input _product_image_gallery (comma-separated IDs)
 * - Append mode (không ghi đè)
 * - Lazy loading (> 20 ảnh)
 */
export function ProductGalleryBox({
  galleryImages = [],
  onImagesChange,
  onAltTextChange,
}: ProductGalleryBoxProps) {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>(galleryImages);

  // Sync with prop changes
  useEffect(() => {
    setImages(galleryImages);
  }, [galleryImages]);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        onImagesChange(newItems);
        return newItems;
      });
    }
  };

  const handleMediaSelect = (items: MediaItem | MediaItem[]) => {
    // In multiple mode, onSelect returns an array
    const selectedItems = Array.isArray(items) ? items : [items];
    
    // Convert to GalleryImage format
    const newGalleryImages: GalleryImage[] = selectedItems.map((item) => ({
      id: item.id,
      thumbnail_url: item.thumbnail_url || item.url,
      title: item.title,
    }));

    // Append mode: add to existing images (don't overwrite)
    const updatedImages = [...images, ...newGalleryImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setShowMediaModal(false);
  };

  const handleRemove = (imageId: string) => {
    // Optimistic UI: remove immediately
    const newImages = images.filter((img) => img.id !== imageId);
    setImages(newImages);
    onImagesChange(newImages);
  };

  // Generate comma-separated IDs string for hidden input
  const galleryIdsString = images.map((img) => img.id).join(',');

  // Use lazy loading for thumbnails if > 20 images
  const useLazyLoading = images.length > 20;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Thư viện hình ảnh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hidden input for _product_image_gallery */}
          <input
            type="hidden"
            name="_product_image_gallery"
            value={galleryIdsString}
          />

          {/* Gallery Grid */}
          {images.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((img) => img.id)}
              >
                <div className="grid grid-cols-3 gap-2" style={{ gridAutoRows: '80px' }}>
                  {images.map((image) => (
                    <SortableGalleryItem
                      key={image.id}
                      image={image}
                      onRemove={() => handleRemove(image.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div 
              className="rounded-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/50"
              style={{ width: '80px', height: '80px' }}
            >
              <div className="text-center">
                <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Chưa có</p>
              </div>
            </div>
          )}

          {/* Add Gallery Images Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMediaModal(true)}
            className="w-full"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Thêm ảnh thư viện sản phẩm
          </Button>

          {/* Info */}
          {images.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {images.length} hình ảnh • Kéo thả để sắp xếp
            </p>
          )}

          {/* Alt Text Inputs for Gallery Images */}
          {images.length > 0 && (
            <div className="mt-4 space-y-3 pt-4 border-t">
              <Label className="text-xs font-medium">
                Văn bản thay thế (Alt Text) cho SEO
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {images.map((image) => (
                  <div key={image.id} className="flex gap-2 items-center">
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border">
                      <img
                        src={image.thumbnail_url}
                        alt={image.altText || `Gallery ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Input
                      type="text"
                      placeholder="Nhập alt text cho hình ảnh này"
                      value={image.altText || ''}
                      onChange={(e) => {
                        const updatedImages = images.map((img) =>
                          img.id === image.id
                            ? { ...img, altText: e.target.value }
                            : img
                        );
                        setImages(updatedImages);
                        onImagesChange(updatedImages);
                        onAltTextChange?.(image.id, e.target.value);
                      }}
                      className="text-xs flex-1"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Alt text giúp cải thiện SEO và khả năng tiếp cận
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
        mode="multiple"
        selectedIds={images.map((img) => img.id)}
        buttonText="Thêm vào thư viện"
      />
    </>
  );
}
