'use client';

import Link from 'next/link';
import { usePostCategories } from '@/lib/hooks/usePostCategories';
import { buttonVariants } from '@/lib/utils/button-variants';

export function PostCategories() {
  const { categories, loading } = usePostCategories();

  // Blog feature is temporarily disabled
  if (loading || categories.length === 0) {
    return null;
  }

  const totalCount = categories.reduce((sum: number, cat: any) => sum + (cat.count || 0), 0);

  return (
    <div className="space-y-2">
      <Link
        href="/blog/posts"
        className={`${buttonVariants({ variant: 'outline', size: 'sm' })} w-full justify-between`}
      >
        Tất cả ({totalCount})
      </Link>
      {categories.map((category: any) => (
        <Link
          key={category.id || category.slug}
          href={`/blog/posts?category=${category.slug}`}
          className={`${buttonVariants({ variant: 'outline', size: 'sm' })} w-full justify-between`}
        >
          {category.name} ({category.count || 0})
        </Link>
      ))}
    </div>
  );
}
