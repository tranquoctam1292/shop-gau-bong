'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface ProductCellProps {
  product: MappedProduct;
}

export function ProductCell({ product }: ProductCellProps) {
  const imageUrl = product.image?.sourceUrl || '/images/teddy-placeholder.png';
  const imageAlt = product.image?.altText || product.name;
  
  // Truncate description to 3 lines
  const shortDescription = product.shortDescription || product.description || '';
  const truncatedDescription = shortDescription.length > 150
    ? shortDescription.substring(0, 150) + '...'
    : shortDescription;

  return (
    <div className="flex items-start gap-3 min-w-[300px]">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
        >
          {product.name}
        </Link>
        {truncatedDescription && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-3">
            {truncatedDescription}
          </p>
        )}
      </div>
    </div>
  );
}

