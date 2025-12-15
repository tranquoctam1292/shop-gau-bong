'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: Array<{
    sourceUrl: string;
    altText?: string;
  }>;
  productName?: string;
  selectedVariationImage?: string; // Ảnh từ variation được chọn (màu sắc)
}

export function ProductGallery({ images, productName, selectedVariationImage }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fallback to placeholder if no images
  const baseImages = images.length > 0 
    ? images 
    : [{ sourceUrl: '/images/teddy-placeholder.png', altText: productName || 'Sản phẩm' }];

  // Nếu có selectedVariationImage, đặt nó làm ảnh đầu tiên
  const allImages = useMemo(() => {
    if (selectedVariationImage) {
      // Tìm xem variation image đã có trong images chưa
      const existingIndex = baseImages.findIndex(img => img.sourceUrl === selectedVariationImage);
      if (existingIndex >= 0) {
        // Nếu đã có, di chuyển nó lên đầu
        const reordered = [
          baseImages[existingIndex],
          ...baseImages.filter((_, idx) => idx !== existingIndex)
        ];
        return reordered;
      } else {
        // Nếu chưa có, thêm vào đầu
        return [
          { sourceUrl: selectedVariationImage, altText: productName || 'Sản phẩm' },
          ...baseImages
        ];
      }
    }
    return baseImages;
  }, [baseImages, selectedVariationImage, productName]);

  // Reset selectedImageIndex về 0 khi selectedVariationImage thay đổi
  useEffect(() => {
    if (selectedVariationImage) {
      setSelectedImageIndex(0);
    }
  }, [selectedVariationImage]);

  const mainImage = allImages[selectedImageIndex] || allImages[0];
  const thumbnails = allImages.slice(0, 5); // Limit to 5 thumbnails

  // Circular navigation handlers
  const handlePrevious = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => {
      if (prev === 0) {
        return allImages.length - 1; // Loop to last image
      }
      return prev - 1;
    });
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => {
      if (prev === allImages.length - 1) {
        return 0; // Loop to first image
      }
      return prev + 1;
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
        <Image
          src={mainImage.sourceUrl}
          alt={mainImage.altText || productName || 'Sản phẩm'}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
        />
        
        {/* Badge Logo "GB" */}
        <div className="absolute top-4 left-4 bg-white/90 p-1 rounded-full shadow-sm w-6 h-6 flex items-center justify-center z-10">
          <span className="text-[8px] font-extrabold text-pink-500">GB</span>
        </div>

        {/* Navigation Arrows - Only show if more than 1 image */}
        {allImages.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all z-10 w-10 h-10 flex items-center justify-center"
              aria-label="Hình trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all z-10 w-10 h-10 flex items-center justify-center"
              aria-label="Hình tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {thumbnails.length > 1 && (
        <div className="flex md:grid md:grid-cols-5 gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:overflow-x-visible md:snap-none">
          {thumbnails.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl transition-all flex-shrink-0 snap-center",
                "border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "w-20 h-20 md:w-auto md:h-auto", // Fixed size on mobile for consistent scrolling
                selectedImageIndex === index
                  ? "border-primary scale-105"
                  : "border-transparent hover:border-pink-300"
              )}
              aria-label={`Xem hình ${index + 1} của sản phẩm`}
              aria-pressed={selectedImageIndex === index}
            >
              <Image
                src={img.sourceUrl}
                alt={img.altText || `Hình ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80px, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

