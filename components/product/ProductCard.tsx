'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';
import { useCartStore } from '@/lib/store/cartStore';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { ProductBadges } from './ProductBadges';
import { buttonVariants } from '@/lib/utils/button-variants';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface ProductCardProps {
  product: MappedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartSync();
  
  // Safety check: Handle null/undefined theo .cursorrules
  if (!product || !product.name) {
    return null;
  }
  const imageUrl = product.image?.sourceUrl || '/images/teddy-placeholder.png';
  const price = product.price || null;
  const formattedPrice = formatPrice(price);
  const isOutOfStock = product.stockStatus === 'outofstock' || product.stockStatus === 'OUT_OF_STOCK';

  // Get product specs for shipping calculation (từ mapped product)
  const length = product.length;
  const width = product.width;
  const height = product.height;
  const volumetricWeight = product.volumetricWeight;
  const weight = product.weight ? parseFloat(product.weight) : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    await addToCart({
      productId: product.databaseId,
      productName: product.name,
      price: product.price || '0',
      image: product.image?.sourceUrl,
      length: length || undefined,
      width: width || undefined,
      height: height || undefined,
      weight: weight || undefined,
      volumetricWeight: volumetricWeight || undefined,
    });
  };

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug || product.databaseId}`}>
        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl">
          <Image
            src={imageUrl}
            alt={product.image?.altText || product.name || 'Gấu bông'}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <ProductBadges
            onSale={product.onSale}
            featured={false} // TODO: Add featured field to REST API
            isNew={false} // TODO: Add isNew field based on date
          />
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link href={`/products/${product.slug || product.databaseId}`}>
          <h3 className="font-heading text-lg font-semibold text-text-main line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Size Options (nếu có length) */}
        {length && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-medium">Kích thước:</span>
            <span>{length}cm</span>
            {width && height && (
              <span className="text-xs">({length}×{width}×{height}cm)</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-primary">
            {formattedPrice}
          </p>
          {isOutOfStock && (
            <span className="text-xs text-text-muted bg-muted px-2 py-1 rounded-full">
              Hết hàng
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/products/${product.slug || product.databaseId}`}
            className={buttonVariants({ variant: 'outline', className: 'flex-1 min-h-[44px]' })}
          >
            Xem chi tiết
          </Link>
          <Button
            className="flex-1 min-h-[44px]"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

