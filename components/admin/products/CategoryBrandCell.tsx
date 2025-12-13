'use client';

import Link from 'next/link';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface CategoryBrandCellProps {
  product: MappedProduct;
}

export function CategoryBrandCell({ product }: CategoryBrandCellProps) {
  const category = product.categories?.[0];
  const brand = (product as any).brand; // Brand field may not be in MappedProduct type yet

  return (
    <div className="space-y-1">
      {category && (
        <div>
          <Link
            href={`/admin/categories?search=${category.slug}`}
            className="text-sm text-gray-900 hover:text-blue-600 transition-colors"
          >
            {category.name}
          </Link>
        </div>
      )}
      {brand && (
        <div className="text-xs text-gray-500">
          {brand}
        </div>
      )}
      {!category && !brand && (
        <span className="text-sm text-gray-400">-</span>
      )}
    </div>
  );
}

