'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ProductList } from '@/components/product/ProductList';
import { EnhancedSearchBar } from '@/components/search/EnhancedSearchBar';
import { AdvancedFilters } from '@/components/product/AdvancedFilters';
import { useProductFilters } from '@/lib/hooks/useProductFilters';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const { updateFilter } = useProductFilters();

  // Sync search query với filters
  useEffect(() => {
    if (query) {
      updateFilter('search', query);
    } else {
      updateFilter('search', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="min-h-screen">
      <div className="container-mobile py-6 md:py-8 border-b">
        <h1 className="font-heading text-2xl md:text-3xl mb-4">
          Tìm kiếm sản phẩm
        </h1>
        <div className="max-w-md">
          <EnhancedSearchBar />
        </div>
        {query && (
          <p className="text-text-muted mt-4">
            Kết quả tìm kiếm cho: <span className="font-semibold">&quot;{query}&quot;</span>
          </p>
        )}
      </div>
      <div className="container-mobile py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <AdvancedFilters />
          </aside>
          {/* Products List */}
          <div className="lg:col-span-3">
            <ProductList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <div className="container-mobile py-6 md:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4" />
            <div className="h-4 bg-muted rounded w-96" />
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
