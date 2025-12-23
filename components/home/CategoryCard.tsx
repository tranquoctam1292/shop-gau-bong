'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface CategoryCardProps {
  id: string;
  name: string;
  slug: string;
  count?: number | null;
  image?: {
    sourceUrl: string;
    altText?: string | null;
  } | null;
}

/**
 * CategoryCard component - Hiển thị một danh mục sản phẩm
 * Mobile-first: Touch-friendly, rounded corners, hover effects
 */
export function CategoryCard({ name, slug, count, image }: CategoryCardProps) {
  // Fallback image nếu không có image từ WordPress
  const imageUrl = image?.sourceUrl || '/images/teddy-placeholder.png';
  const altText = image?.altText || name || 'Danh mục sản phẩm';

  return (
    <Link href={`/products?category=${slug}`}>
      <Card className="group relative overflow-hidden rounded-2xl transition-all hover:shadow-md active:scale-95">
        {/* Category Image */}
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Category Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-heading text-lg font-semibold">{name}</h3>
          {count !== null && count !== undefined && count > 0 && (
            <p className="text-sm opacity-90">{count} sản phẩm</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

