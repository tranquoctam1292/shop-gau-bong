import { ProductList } from '@/components/product/ProductList';
import { ProductFilters } from '@/components/product/ProductFilters';

export default function ProductsPage() {
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

