'use client';

import Link from 'next/link';
import { useProductsForHome } from '@/lib/hooks/useProductsForHome';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/lib/utils/button-variants';

/**
 * Featured Products Section
 * 
 * Hiển thị sản phẩm nổi bật (featured)
 * Grid: 2 cols mobile, 4 cols desktop
 */
export function FeaturedProducts() {
  const { products, loading, error } = useProductsForHome({
    featured: true,
    per_page: 8, // 2 hàng x 4 cột = 8 sản phẩm
  });

  if (error) {
    return null; // Fail silently, không hiển thị section nếu có lỗi
  }

  if (loading) {
    return (
      <section className="container-mobile py-8 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl md:text-3xl">
            ⭐ Sản phẩm nổi bật
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
    return null; // Không hiển thị nếu không có sản phẩm
  }

  return (
    <section className="container-mobile py-8 md:py-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl md:text-3xl">
          ⭐ Sản phẩm nổi bật
        </h2>
        <Link 
          href="/products?featured=true"
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

