'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProductsREST } from '@/lib/hooks/useProductsREST';
import { ProductCard } from './ProductCard';
import { ViewToggle } from './ViewToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { ProductListSkeleton } from '@/components/ui/skeleton';
import { NoProductsFoundState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

interface ProductListProps {
  initialCount?: number;
}

export function ProductList({ initialCount = 12 }: ProductListProps) {
  const { products, loading, error, hasNextPage, loadMore, totalCount } = useProductsREST(initialCount);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addToCart } = useCartSync();

  // Hiển thị skeleton khi đang loading (cả lần đầu và khi filter thay đổi)
  if (loading && products.length === 0) {
    return (
      <div className="w-full">
        <ProductListSkeleton count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <ErrorState
          title="Không thể tải sản phẩm"
          message={error.message || 'Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại sau.'}
          action={{
            label: 'Thử lại',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="w-full">
        <NoProductsFoundState />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Loading overlay khi đang filter (có products nhưng đang loading) */}
      {loading && products.length > 0 && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-muted">Đang tải...</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        {totalCount > 0 && (
          <p className="text-sm text-text-muted">
            Tìm thấy {totalCount} sản phẩm
          </p>
        )}
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-4 lg:gap-6">
          {products.map((product) => {
            if (!product || !product.name) {
              return null;
            }
            return <ProductCard key={product.id || product.databaseId} product={product} />;
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            if (!product || !product.name) {
              return null;
            }
            const isOutOfStock = product.stockStatus === 'outofstock' || product.stockStatus === 'OUT_OF_STOCK';
            return (
              <Card key={product.id || product.databaseId} className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    <Image
                      src={product.image?.sourceUrl || '/images/teddy-placeholder.png'}
                      alt={product.image?.altText || product.name || 'Gấu bông'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 96px, 128px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-text-main mb-2">
                      {product.name}
                    </h3>
                    <p className="text-primary font-bold text-xl mb-2">
                      {formatPrice(product.price)}
                    </p>
                    <Button
                      className="w-full md:w-auto"
                      disabled={isOutOfStock}
                      onClick={async () => {
                        if (!isOutOfStock) {
                          await addToCart({
                            // FIX: Keep productId as string (MongoDB ObjectId) - don't use parseInt on hex string
                            productId: product.databaseId || product.id,
                            productName: product.name,
                            price: product.price || '0',
                            image: product.image?.sourceUrl,
                            length: product.length || undefined,
                            width: product.width || undefined,
                            height: product.height || undefined,
                            weight: product.weight ? parseFloat(product.weight) : undefined,
                            volumetricWeight: product.volumetricWeight || undefined,
                          });
                        }
                      }}
                    >
                      {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {hasNextPage && (
        <div className="mt-8 text-center">
          <Button onClick={loadMore} variant="outline">
            Xem thêm sản phẩm
          </Button>
        </div>
      )}
    </div>
  );
}

