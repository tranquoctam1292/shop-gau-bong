import { ProductList } from '@/components/product/ProductList';
import { ProductFilters } from '@/components/product/ProductFilters';
import { AdvancedFilters } from '@/components/product/AdvancedFilters';

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      <div className="container-mobile py-6 md:py-8 border-b">
        <h1 className="font-heading text-2xl md:text-3xl">
          Tất cả sản phẩm
        </h1>
        <p className="text-text-muted mt-2">
          Khám phá bộ sưu tập gấu bông đáng yêu của chúng tôi
        </p>
      </div>
      <div className="container-mobile py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <ProductFilters />
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

