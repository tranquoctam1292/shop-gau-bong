'use client';

import Link from 'next/link';
import { useProductsForHome } from '@/lib/hooks/useProductsForHome';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/lib/utils/button-variants';
// Removed unused imports - filtering is now done server-side

/**
 * Bigsize Products Section
 * 
 * Hiển thị sản phẩm bigsize (>= 80cm)
 * Grid: 2 cols mobile, 4-5 cols desktop
 */
export function BigsizeProducts() {
  // Filter server-side: chỉ fetch sản phẩm có length >= 80cm
  const { products: bigsizeProducts, loading, error } = useProductsForHome({
    per_page: 8, // Chỉ cần 8 sản phẩm (2 hàng x 4 cột)
    min_length: 80, // Filter server-side: bigsize >= 80cm
  });

  if (error) {
    return null; // Fail silently
  }

  if (loading) {
    return (
      <section className="container-mobile py-8 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl md:text-3xl">
            🐻 Gấu Bông Bigsize
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!bigsizeProducts || bigsizeProducts.length === 0) {
    return null; // Không hiển thị nếu không có sản phẩm bigsize
  }

  return (
    <section className="container-mobile py-8 md:py-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl md:text-3xl">
          🐻 Gấu Bông Bigsize
        </h2>
        <Link 
          href="/products?size=bigsize"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          Xem tất cả →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {bigsizeProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

