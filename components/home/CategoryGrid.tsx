'use client';

import { useCategoriesContext } from '@/lib/providers/CategoriesProvider';
import { CategoryCard } from './CategoryCard';

/**
 * CategoryGrid component - Hiển thị grid danh mục sản phẩm
 * Layout: 2 cols mobile, 4 cols desktop, tối đa 4 danh mục nổi bật (featured = true)
 * Mobile-first design với touch-friendly cards
 */
export function CategoryGrid() {
  const { categories, loading, error } = useCategoriesContext();

  // Loading state
  if (loading) {
    return (
      <div className="container-mobile py-8 md:py-16">
        <h2 className="font-heading text-2xl md:text-3xl mb-6 text-center">
          Danh mục sản phẩm
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-mobile py-8 md:py-16">
        <h2 className="font-heading text-2xl md:text-3xl mb-6 text-center">
          Danh mục sản phẩm
        </h2>
        <p className="text-center text-text-muted">
          Không thể tải danh mục. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  // Empty state
  if (!categories || categories.length === 0) {
    return (
      <div className="container-mobile py-8 md:py-16">
        <h2 className="font-heading text-2xl md:text-3xl mb-6 text-center">
          Danh mục sản phẩm
        </h2>
        <p className="text-center text-text-muted">
          Chưa có danh mục sản phẩm nào.
        </p>
      </div>
    );
  }

  // Filter và limit: chỉ hiển thị tối đa 4 danh mục nổi bật (featured = true)
  const featuredCategories = categories
    .filter((cat) => cat.featured === true)
    .slice(0, 4); // Tối đa 4 danh mục
  
  const displayCategories = featuredCategories;

  return (
    <section className="container-mobile py-8 md:py-16">
      <h2 className="font-heading text-2xl md:text-3xl mb-6 text-center">
        Danh mục sản phẩm
      </h2>
      <p className="text-center text-text-muted mb-8">
        Khám phá bộ sưu tập gấu bông đáng yêu của chúng tôi
      </p>
      
      {/* Grid: 2 cols mobile, 4 cols desktop, tối đa 4 danh mục nổi bật */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {displayCategories.map((category) => {
          // Type guard để đảm bảo category có đủ fields
          if (!category || !category.name || !category.slug) {
            return null;
          }

          return (
            <CategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              slug={category.slug}
              count={category.count ?? null}
              image={category.image ? {
                sourceUrl: category.image.sourceUrl,
                altText: category.image.altText || null,
              } : null}
            />
          );
        })}
      </div>
    </section>
  );
}

