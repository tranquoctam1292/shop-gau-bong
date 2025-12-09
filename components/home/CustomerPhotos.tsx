'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface CustomerPhoto {
  id: string;
  image: string;
  alt: string;
  caption?: string;
}

interface CustomerPhotosProps {
  photos?: CustomerPhoto[];
  title?: string;
  subtitle?: string;
}

/**
 * Customer Photos Section
 * 
 * Instagram-style grid của customer photos
 * Social proof section để build trust
 * 
 * Note: Hiện tại sử dụng placeholder images
 * Future: Có thể integrate với Instagram API hoặc manual uploads
 */
export function CustomerPhotos({
  photos,
  title = 'Hình ảnh khách hàng',
  subtitle = 'Cảm ơn bạn đã tin yêu và đồng hành cùng Shop Gấu Bông',
}: CustomerPhotosProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Default placeholder photos nếu không có data từ CMS
  // TODO: Fetch from WordPress ACF Options or Custom Post Type "customer_photos"
  // Admin can upload customer photos in WordPress admin panel
  const defaultPhotos: CustomerPhoto[] = [
    { id: '1', image: '/images/teddy-placeholder.png', alt: 'Khách hàng với gấu bông', caption: 'Khách hàng hạnh phúc' },
    { id: '2', image: '/images/teddy-placeholder.png', alt: 'Gấu bông quà tặng', caption: 'Quà tặng ý nghĩa' },
    { id: '3', image: '/images/teddy-placeholder.png', alt: 'Gấu bông sinh nhật', caption: 'Sinh nhật vui vẻ' },
    { id: '4', image: '/images/teddy-placeholder.png', alt: 'Gấu bông Valentine', caption: 'Valentine ngọt ngào' },
    { id: '5', image: '/images/teddy-placeholder.png', alt: 'Gấu bông trẻ em', caption: 'Bé yêu thích' },
    { id: '6', image: '/images/teddy-placeholder.png', alt: 'Gấu bông bigsize', caption: 'Gấu bông lớn' },
  ];

  const displayPhotos = photos || defaultPhotos;

  const handlePhotoClick = (photo: CustomerPhoto) => {
    setSelectedPhoto(photo.image);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  return (
    <section className="container-mobile py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-text-muted text-base md:text-lg max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {displayPhotos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => handlePhotoClick(photo)}
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg',
              'group cursor-pointer transition-transform hover:scale-105',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            aria-label={photo.alt}
          >
            <Image
              src={photo.image}
              alt={photo.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            {/* Caption overlay (optional) */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs md:text-sm text-left line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng"
          >
            ✕
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedPhoto}
              alt="Customer photo"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </section>
  );
}

