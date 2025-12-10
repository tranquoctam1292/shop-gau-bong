import { ProductList } from '@/components/product/ProductList';
import { ProductFilters } from '@/components/product/ProductFilters';

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
        {/* ProductFilters - Full width, nằm ngang */}
        <div className="mb-6 md:mb-8">
          <ProductFilters />
        </div>
        
        {/* ProductList - Nằm ngay bên dưới */}
        <ProductList />
      </div>
    </div>
  );
}

