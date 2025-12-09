'use client';

import Link from 'next/link';
import { useProductsForHome } from '@/lib/hooks/useProductsForHome';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/lib/utils/button-variants';

/**
 * Trending Products Section
 * 
 * Hiển thị sản phẩm hot/trending (best sellers hoặc featured)
 * Grid: 2 cols mobile, 4-5 cols desktop
 */
export function TrendingProducts() {
  const { products, loading, error } = useProductsForHome({
    orderby: 'popularity',
    order: 'desc',
    per_page: 8, // 2 hàng x 4 cột = 8 sản phẩm
  });

  if (error) {
    return null; // Fail silently
  }

  if (loading) {
    return (
      <section className="container-mobile py-8 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl md:text-3xl">
            🔥 Thú Bông Hot
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

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="container-mobile py-8 md:py-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl md:text-3xl">
          🔥 Thú Bông Hot
        </h2>
        <Link 
          href="/products?sort=popularity"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          Xem tất cả →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

