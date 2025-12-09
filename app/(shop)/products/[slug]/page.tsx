'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';
import { useProductREST } from '@/lib/hooks/useProductREST';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/utils/schema';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [quantity, setQuantity] = useState(1);

  const { product, loading, error } = useProductREST(slug, 'slug');
  const { addToCart } = useCartSync();

  if (loading) {
    return (
      <div className="container-mobile py-8 md:py-16">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !product.name) {
    return (
      <div className="container-mobile py-8 md:py-16 text-center">
        <p className="text-destructive">Không tìm thấy sản phẩm.</p>
      </div>
    );
  }

  const mainImage = product.image?.sourceUrl || '/images/teddy-placeholder.png';
  const galleryImages = product.galleryImages || [];
  const price = product.price || null;
  const formattedPrice = formatPrice(price);
  const isInStock = product.stockStatus === 'instock' || product.stockStatus === 'IN_STOCK';

  // Get product specs (từ mapped product)
  const length = product.length;
  const width = product.width;
  const height = product.height;
  const volumetricWeight = product.volumetricWeight;
  const material = product.material;
  const origin = product.origin;

  const handleAddToCart = async () => {
    for (let i = 0; i < quantity; i++) {
      await addToCart({
        productId: product.databaseId,
        productName: product.name,
        price: product.price || '0',
        image: product.image?.sourceUrl,
        length: length || undefined,
        width: width || undefined,
        height: height || undefined,
        weight: product.weight ? parseFloat(product.weight) : undefined,
        volumetricWeight: volumetricWeight || undefined,
      });
    }
  };

  // Generate structured data for SEO
  const productSchema = generateProductSchema({
    name: product.name || 'Sản phẩm',
    description: product.description || null,
    image: product.image?.sourceUrl || null,
    price: product.price || null,
    currency: 'VND',
    sku: product.sku || null,
    availability: isInStock ? 'InStock' : 'OutOfStock',
    brand: 'Shop Gấu Bông',
    category: 'Gấu bông',
    url: typeof window !== 'undefined' ? `${window.location.origin}/products/${product.slug || product.databaseId}` : undefined,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
  const productUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/products/${product.slug || product.databaseId}` 
    : `${siteUrl}/products/${product.slug || product.databaseId}`;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: siteUrl },
    { name: 'Sản phẩm', url: `${siteUrl}/products` },
    { name: product.name || 'Sản phẩm', url: productUrl },
  ]);

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <div className="container-mobile py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
            <Image
              src={mainImage}
              alt={product.image?.altText || product.name || 'Gấu bông'}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {galleryImages.slice(0, 4).map((img, index: number) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={img.sourceUrl || '/images/teddy-placeholder.png'}
                    alt={img.altText || `Hình ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl mb-2">
              {product.name}
            </h1>
            {product.sku && (
              <p className="text-sm text-text-muted">
                SKU: {product.sku}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-primary">
              {formattedPrice}
            </p>
            {product.onSale && product.regularPrice && product.regularPrice !== product.price && (
              <p className="text-lg text-text-muted line-through">
                {formatPrice(product.regularPrice)}
              </p>
            )}
          </div>

          {/* Product Specs */}
          {(length || width || height || material || origin) && (
            <Card className="p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">
                Thông số sản phẩm
              </h3>
              <div className="space-y-2 text-sm">
                {length && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Chiều dài:</span>
                    <span className="font-medium">{length} cm</span>
                  </div>
                )}
                {width && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Chiều rộng:</span>
                    <span className="font-medium">{width} cm</span>
                  </div>
                )}
                {height && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Chiều cao:</span>
                    <span className="font-medium">{height} cm</span>
                  </div>
                )}
                {volumetricWeight && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Cân nặng quy đổi:</span>
                    <span className="font-medium">{volumetricWeight} kg</span>
                  </div>
                )}
                {material && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Chất liệu:</span>
                    <span className="font-medium">{material}</span>
                  </div>
                )}
                {origin && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Xuất xứ:</span>
                    <span className="font-medium">{origin}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Stock Status */}
          <div>
            {isInStock ? (
              <p className="text-green-600 font-medium">✓ Còn hàng</p>
            ) : (
              <p className="text-destructive font-medium">✗ Hết hàng</p>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Số lượng
              </label>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={product.stockQuantity || 99}
                disabled={!isInStock}
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!isInStock}
              onClick={handleAddToCart}
            >
              {isInStock ? `Thêm ${quantity} vào giỏ hàng` : 'Hết hàng'}
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              Yêu thích
            </Button>
          </div>

          {/* Description */}
          {product.description && (
            <Card className="p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">
                Mô tả sản phẩm
              </h3>
              <div
                className="prose prose-sm max-w-none text-text-main"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        productId={product.databaseId || 0}
        excludeId={product.databaseId || undefined}
      />
      </div>
    </>
  );
}
