'use client';

import { Suspense } from 'react';
import { ProductList } from '@/components/product/ProductList';
import { ProductFilters } from '@/components/product/ProductFilters';

function ProductsContent() {
  return (
    <div className="min-h-screen">
      {/* Content Section - Vertical Stack */}
      <div className="container-mobile py-6 md:py-8">
        {/* Product Filters - Full Width, Horizontal Layout */}
        <div className="mb-6 md:mb-8">
          <ProductFilters />
        </div>

        {/* Product List */}
        <ProductList />
      </div>
    </div>
  );
}

export default function ProductsPage() {
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
      <ProductsContent />
    </Suspense>
  );
}

