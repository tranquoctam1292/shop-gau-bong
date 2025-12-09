'use client';

import { useProductsREST } from '@/lib/hooks/useProductsREST';
import { ProductCard } from './ProductCard';

interface RelatedProductsProps {
  productId: number;
  excludeId?: number;
}

export function RelatedProducts({
  productId,
  excludeId,
}: RelatedProductsProps) {
  // Get related products (simply get latest products, exclude current)
  const { products, loading } = useProductsREST(8);

  // Filter out current product
  const filteredProducts = products?.filter(
    (product) => Number(product.id) !== (excludeId || productId)
  ).slice(0, 4) || [];

  if (loading) {
    return (
      <div className="container-mobile py-8">
        <h2 className="font-heading text-2xl font-semibold mb-6">
          Sản phẩm liên quan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-2xl mb-4" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-6 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="container-mobile py-8">
      <h2 className="font-heading text-2xl font-semibold mb-6">
        Sản phẩm liên quan
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
