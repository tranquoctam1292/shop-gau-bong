'use client';

import Link from 'next/link';
import { useProductsForHome } from '@/lib/hooks/useProductsForHome';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/lib/utils/button-variants';

interface CategoryProductsProps {
  categorySlug: string;
  categoryName: string;
  emoji?: string;
  perPage?: number; // Default: 8 (2 hàng x 4 cột)
}

/**
 * Category Products Section (Reusable)
 * 
 * Hiển thị products từ một category cụ thể
 * Grid: 2 cols mobile, 4 cols desktop
 */
export function CategoryProducts({
  categorySlug,
  categoryName,
  emoji = '🧸',
  perPage = 8, // 2 hàng x 4 cột = 8 sản phẩm
}: CategoryProductsProps) {
  // Note: useProductsForHome không support category filter trực tiếp
  // Cần fetch tất cả và filter client-side hoặc tạo hook mới
  // Tạm thời sử dụng useProductsForHome và filter sau
  const { products, loading, error } = useProductsForHome({
    per_page: 20, // Fetch more để filter
  });

  // Filter by category slug (client-side)
  const categoryProducts = products?.filter((product) => {
    return product.categories?.some((cat) => cat.slug === categorySlug);
  }).slice(0, 8) || []; // Always show 8 products (2 hàng x 4 cột)

  if (error) {
    return null; // Fail silently
  }

  if (loading) {
    return (
      <section className="w-full px-2 md:container-mobile md:px-8 py-8 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl md:text-3xl">
            {emoji} {categoryName}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!categoryProducts || categoryProducts.length === 0) {
    return null; // Không hiển thị nếu không có sản phẩm
  }

  return (
    <section className="w-full px-2 md:container-mobile md:px-8 py-8 md:py-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl md:text-3xl">
          {emoji} {categoryName}
        </h2>
        <Link 
          href={`/products?category=${categorySlug}`}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          Xem tất cả →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
        {categoryProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

