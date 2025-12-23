'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProductREST } from '@/lib/hooks/useProductREST';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/utils/schema';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { QuickOrderBox } from '@/components/product/QuickOrderBox';
import { ProductHighlights } from '@/components/product/ProductHighlights';
import { ProductDescription } from '@/components/product/ProductDescription';
import { ProductPromotions } from '@/components/product/ProductPromotions';
import { ProductFeatures } from '@/components/product/ProductFeatures';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [selectedVariationImage, setSelectedVariationImage] = useState<string | undefined>(undefined);

  const { product, loading, error } = useProductREST(slug, 'slug');

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

  const galleryImages = product.galleryImages || [];
  const isInStock = product.stockStatus === 'instock' || product.stockStatus === 'IN_STOCK';

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
      {/* Mobile: Flex column với order, Desktop: Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
        {/* ProductGallery - Mobile: order-1, Desktop: Cột trái */}
        <div className="order-1 lg:col-span-7">
          <ProductGallery 
            images={[product.image, ...galleryImages].filter(Boolean).map(img => ({
              sourceUrl: img?.sourceUrl || '/images/teddy-placeholder.png',
              altText: img?.altText || product.name
            }))}
            productName={product.name}
            selectedVariationImage={selectedVariationImage}
          />
        </div>

        {/* Cột phải - Sticky container cho desktop, các phần tử riêng lẻ cho mobile */}
        <div className="order-2 lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6">
            {/* ProductInfo */}
            <ProductInfo 
              product={product} 
              onVariationChange={(variationImage) => setSelectedVariationImage(variationImage)}
            />
            
            {/* QuickOrderBox */}
            {product.databaseId && (
              <QuickOrderBox 
                // FIX: Keep productId as string (MongoDB ObjectId) - don't use parseInt on hex string
                productId={product.databaseId || product.id}
                productName={product.name}
              />
            )}
            
            {/* Product Features */}
            <ProductFeatures />
            
            {/* Product Promotions */}
            <ProductPromotions 
              promotions={{
                freeGift: true,
                freeCard: true,
                freeShip: true,
              }}
            />
          </div>
        </div>
        
        {/* ProductHighlights - Mobile: order-6, Desktop: Cột trái */}
        <div className="order-6 lg:col-span-7">
          <ProductHighlights 
            description={product.description}
            attributes={product.attributes}
            material={product.material ?? undefined}
            origin={product.origin ?? undefined}
            variations={undefined}
          />
        </div>
        
        {/* ProductDescription - Mobile: order-7, Desktop: Cột trái */}
        {product.description && (
          <div className="order-7 lg:col-span-7">
            <ProductDescription content={product.description} />
          </div>
        )}
      </div>
      </div>

      {/* Related Products - Render outside container để có padding riêng */}
      {product.databaseId && (
        <RelatedProducts
          // FIX: Keep productId as string (MongoDB ObjectId) - don't use parseInt on hex string
          productId={product.databaseId || product.id}
          excludeId={product.databaseId || product.id}
        />
      )}
    </>
  );
}
