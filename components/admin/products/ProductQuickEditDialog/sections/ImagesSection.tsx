'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MediaLibraryModal } from '../../MediaLibraryModal';
import { ImageIcon, X, Plus } from 'lucide-react';
import Image from 'next/image';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import type { MappedProduct } from '@/lib/utils/productMapper';

/**
 * Images Section Component
 * 
 * PHASE 2: Extract Form Sections - ImagesSection
 * 
 * Displays featured image and gallery images with MediaLibraryModal integration
 * Uses Context API to access form state and handlers
 * 
 * @param product - Product data for displaying images
 * @param mediaLibraryOpen - State to control MediaLibraryModal visibility
 * @param setMediaLibraryOpen - Setter for MediaLibraryModal visibility
 * @param mediaLibraryMode - Mode for MediaLibraryModal ('featured' or 'gallery')
 * @param setMediaLibraryMode - Setter for MediaLibraryModal mode
 */
interface ImagesSectionProps {
  product?: MappedProduct;
  mediaLibraryOpen: boolean;
  setMediaLibraryOpen: (open: boolean) => void;
  mediaLibraryMode: 'featured' | 'gallery';
  setMediaLibraryMode: (mode: 'featured' | 'gallery') => void;
}

export const ImagesSection = memo(function ImagesSection({
  product,
  mediaLibraryOpen,
  setMediaLibraryOpen,
  mediaLibraryMode,
  setMediaLibraryMode,
}: ImagesSectionProps) {
  const {
    watch,
    setValue,
  } = useQuickEditFormContext();

  const featuredImageId = watch('_thumbnail_id');
  const galleryImageIds = watch('_product_image_gallery');

  return (
    <>
      {/* UX/UI UPGRADE Phase 1.1.2: Section spacing và borders */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
      <div className="bg-slate-50 border border-slate-200 border-t-slate-300 rounded-md p-3 md:p-4 space-y-4">
        
        {/* Featured Image */}
        <div className="space-y-2">
          <Label className="text-slate-900">Ảnh đại diện</Label>
          <div className="flex items-center gap-4">
            {featuredImageId && product?.image?.sourceUrl ? (
              <div className="relative w-24 h-24 border border-slate-200 rounded-md overflow-hidden">
                <Image
                  src={product.image.sourceUrl}
                  alt={product.image.altText || product?.name || 'Product image'}
                  fill
                  className="object-cover"
                />
                {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
                <button
                  type="button"
                  onClick={() => {
                    setValue('_thumbnail_id', undefined, { shouldDirty: true });
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-red-600"
                  aria-label="Xóa ảnh đại diện"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMediaLibraryMode('featured');
                  setMediaLibraryOpen(true);
                }}
              >
                {featuredImageId ? 'Thay đổi' : 'Chọn ảnh'}
              </Button>
              {featuredImageId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('_thumbnail_id', undefined, { shouldDirty: true });
                  }}
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        <div className="space-y-2">
          <Label className="text-slate-900">Thư viện ảnh</Label>
          <div className="flex flex-wrap gap-2">
            {galleryImageIds && product?.galleryImages && product.galleryImages.length > 0
              ? product!.galleryImages.map((img: any, index: number) => (
                  <div key={index} className="relative w-20 h-20 border border-slate-200 rounded-md overflow-hidden">
                    <Image
                      src={img.sourceUrl}
                      alt={img.altText || `Gallery ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentIds = galleryImageIds.split(',').filter(Boolean);
                        const newIds = currentIds.filter((id) => id !== img.id);
                        setValue('_product_image_gallery', newIds.join(','), { shouldDirty: true });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-red-600"
                      aria-label={`Xóa ảnh ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              : null}
            <button
              type="button"
              onClick={() => {
                setMediaLibraryMode('gallery');
                setMediaLibraryOpen(true);
              }}
              className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center hover:border-slate-400"
            >
              <Plus className="h-6 w-6 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* PHASE 1: Media Library Modal (4.1.2) */}
      <MediaLibraryModal
        isOpen={mediaLibraryOpen}
        onClose={() => setMediaLibraryOpen(false)}
        onSelect={(items) => {
          if (mediaLibraryMode === 'featured') {
            const item = Array.isArray(items) ? items[0] : items;
            if (item) {
              setValue('_thumbnail_id', item.id, { shouldDirty: true });
            }
          } else {
            // Gallery mode - multiple selection
            const itemsArray = Array.isArray(items) ? items : [items];
            const currentIds = galleryImageIds ? galleryImageIds.split(',').filter(Boolean) : [];
            const newIds = [...currentIds, ...itemsArray.map((item) => item.id)];
            setValue('_product_image_gallery', newIds.join(','), { shouldDirty: true });
          }
          setMediaLibraryOpen(false);
        }}
        mode={mediaLibraryMode === 'featured' ? 'single' : 'multiple'}
        selectedIds={
          mediaLibraryMode === 'featured'
            ? featuredImageId ? [featuredImageId] : []
            : galleryImageIds
            ? galleryImageIds.split(',').filter(Boolean)
            : []
        }
        buttonText={mediaLibraryMode === 'featured' ? 'Chọn ảnh đại diện' : 'Thêm vào thư viện'}
      />
    </>
  );
});

ImagesSection.displayName = 'ImagesSection';

