'use client';

import { useParams } from 'next/navigation';
import { useProductREST } from '@/lib/hooks/useProductREST';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/utils/schema';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { QuickOrderBox } from '@/components/product/QuickOrderBox';
import { ProductHighlights } from '@/components/product/ProductHighlights';
import { ProductDescription } from '@/components/product/ProductDescription';
import { VoucherSection } from '@/components/product/VoucherSection';
import { ProductPromotions } from '@/components/product/ProductPromotions';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

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
        {/* CỘT TRÁI - Ảnh & Chi tiết (7/12 columns) */}
        <div className="lg:col-span-7 flex flex-col lg:block space-y-8">
          {/* ProductGallery - Mobile: order-1 */}
          <div className="order-1">
            <ProductGallery 
              images={[product.image, ...galleryImages].filter(Boolean).map(img => ({
                sourceUrl: img?.sourceUrl || '/images/teddy-placeholder.png',
                altText: img?.altText || product.name
              }))}
              productName={product.name}
            />
          </div>
          
          {/* ProductHighlights - Mobile: order-6, Desktop: order-2 */}
          <div className="order-6 lg:order-none">
            <ProductHighlights 
              description={product.description}
              attributes={product.attributes}
              material={product.material ?? undefined}
              origin={product.origin ?? undefined}
              variations={undefined} // Will be fetched by ProductInfo, can be passed here if needed
            />
          </div>
          
          {/* ProductDescription - Mobile: order-7, Desktop: order-3 */}
          {product.description && (
            <div className="order-7 lg:order-none">
              <ProductDescription content={product.description} />
            </div>
          )}
        </div>

        {/* CỘT PHẢI - Thông tin mua hàng (5/12 columns, Sticky) */}
        <div className="lg:col-span-5 flex flex-col lg:block">
          <div className="lg:sticky lg:top-24 space-y-6 flex flex-col lg:block">
            {/* ProductInfo - Mobile: order-2 */}
            <div className="order-2 lg:order-none">
              <ProductInfo product={product} />
            </div>
            
            {/* QuickOrderBox - Mobile: order-3 */}
            <div className="order-3 lg:order-none">
              <QuickOrderBox 
                productId={product.databaseId}
                productName={product.name}
              />
            </div>
            
            {/* Voucher Section - Mobile: order-4 */}
            <div className="order-4 lg:order-none">
              <VoucherSection />
            </div>
            
            {/* Product Promotions - Mobile: order-5 */}
            <div className="order-5 lg:order-none">
              <ProductPromotions 
                promotions={{
                  freeGift: true,
                  freeCard: true,
                  freeShip: true,
                  warranty: true,
                  rewardPoints: true,
                }}
              />
            </div>
          </div>
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
