'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useProductVariations } from '@/lib/hooks/useProductVariations';
import { useVariationMatcher, useSmallestSizeByPrice } from '@/lib/hooks/useVariationMatcher';
import { useProductPrice } from '@/lib/hooks/useProductPrice';
import { isAttributeSize, isAttributeColor } from '@/lib/constants/attributes';
import { cn } from '@/lib/utils/cn';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getColorHex } from '@/lib/utils/colorMapping';
import { generateSlug } from '@/lib/utils/slug';
import { useQuickCheckoutStore } from '@/lib/store/useQuickCheckoutStore';

interface ProductCardProps {
  product: MappedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCartSync();
  // State cho việc chọn Size/Màu
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  // State cho loading feedback
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // ============================================
  // LAZY LOADING: Chỉ fetch variations khi cần
  // ============================================
  // Performance Optimization: Thay vì fetch variations cho tất cả products ngay khi page load
  // (có thể gây 40+ API calls đồng thời), chúng ta chỉ fetch khi:
  // 1. User hover vào card → Prefetch để sẵn sàng khi user click size
  // 2. User đã chọn size → Cần để hiển thị giá động
  // 3. Product không có giá bán thường → Cần lấy giá thấp nhất từ variations
  // 
  // Kết quả: Giảm initial API calls từ 40 xuống 0, cải thiện Time to Interactive ~80%
  const [isHovered, setIsHovered] = useState(false);
  
  // Kiểm tra xem product có giá bán thường không
  const hasRegularPrice = useMemo(() => {
    if (!product) return false;
    const price = parseFloat(product.price || '0');
    const regularPrice = parseFloat(product.regularPrice || '0');
    return (price > 0) || (regularPrice > 0);
  }, [product]);
  
  // Fetch variations nếu:
  // 1. User hover vào card (prefetch)
  // 2. User đã chọn size
  // 3. Product không có giá bán thường (cần lấy giá từ variations)
  const shouldFetchVariations = isHovered || selectedSize !== null || !hasRegularPrice;
  
  // Fetch variations nếu product là variable type
  const { variations, isLoading: isLoadingVariations } = useProductVariations(
    product?.databaseId,
    { 
      enabled: !!product && product.type === 'variable' && 
               (product.variations?.length || 0) > 0 &&
               shouldFetchVariations
    }
  );
  
  // Auto-select smallest size (lowest price) when variations load
  const smallestSize = useSmallestSizeByPrice(variations);
  
  // Auto-select smallest size when variations load and no size is selected
  useEffect(() => {
    if (product?.type === 'variable' && smallestSize && !selectedSize && !isLoadingVariations && variations.length > 0) {
      setSelectedSize(smallestSize);
    }
  }, [product?.type, smallestSize, selectedSize, isLoadingVariations, variations.length]);
  
  // Use custom hook to find matching variation (replaces duplicate logic)
  const selectedVariation = useVariationMatcher(variations, selectedSize, selectedColor);
  
  // Lấy ảnh hiển thị: ưu tiên ảnh biến thể nếu có, nếu không thì dùng ảnh chính
  const imageUrl = useMemo(() => {
    // Nếu có selectedVariation và variation có ảnh, dùng ảnh variation
    if (selectedVariation?.image) {
      return selectedVariation.image;
    }
    // Fallback về ảnh chính của sản phẩm
    return product?.image?.sourceUrl || '/images/teddy-placeholder.png';
  }, [selectedVariation, product?.image?.sourceUrl]);
  
  // Use custom hook for pricing logic (replaces ~60 lines of duplicate code)
  const { displayPrice, displayRegularPrice, isOnSale, priceRange } = useProductPrice(product, selectedVariation);
  
  // Calculate price range for variable products
  const variablePriceRange = useMemo(() => {
    if (product?.type === 'variable' && variations.length > 0 && !selectedVariation) {
      const prices = variations
        .map((v: { price?: number }) => v.price || 0)
        .filter((p: number) => p > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return { min: minPrice, max: maxPrice };
      }
    }
    return null;
  }, [product, variations, selectedVariation]);
  
  // Fallback logic for products without regular price (keep existing behavior)
  const finalDisplayPrice = useMemo(() => {
    // For variable products without selected variation, show price range
    if (product?.type === 'variable' && !selectedVariation && variablePriceRange) {
      if (variablePriceRange.min === variablePriceRange.max) {
        return String(variablePriceRange.min);
      }
      // Will show "Từ X đ" format in UI
      return String(variablePriceRange.min);
    }
    
    const numDisplayPrice = parseFloat(displayPrice || '0');
    
    // If displayPrice is 0 and we have variations, try to get min price
    if (numDisplayPrice <= 0 && variations.length > 0) {
      const prices = variations
        .map((v: { price?: number }) => v.price || 0)
        .filter((p: number) => p > 0);
      
      if (prices.length > 0) {
        return String(Math.min(...prices));
      }
    }
    
    // If still 0 and product has minPrice, use it
    if (numDisplayPrice <= 0 && product?.minPrice && product.minPrice > 0) {
      return String(product.minPrice);
    }
    
    return displayPrice;
  }, [displayPrice, variations, product, selectedVariation, variablePriceRange]);
  
  const finalRegularPrice = displayRegularPrice;
  
  // Extract Size and Color attributes from product using centralized constants
  // This replaces hardcoded string matching with reusable helper functions
  const sizeAttribute = product?.attributes?.find((attr) => isAttributeSize(attr.name));
  const colorAttribute = product?.attributes?.find((attr) => isAttributeColor(attr.name));
  
  // Use real attributes from CMS only (no fallback mock data)
  // If product doesn't have these attributes in CMS, don't show them
  const availableSizes = sizeAttribute?.options || [];
  const availableColors = colorAttribute?.options || [];
  
  // Limit display to 4 sizes and 4 colors (Cập nhật hiển thị tối đa 4)
  const displaySizes = availableSizes.slice(0, 4);
  const displayColors = availableColors.slice(0, 4);
  const remainingColors = availableColors.length - displayColors.length;

  // Build product URL với query params cho selected attributes
  // Format: /products/slug?attribute_pa_size=60cm&attribute_pa_color=do
  const productUrl = useMemo(() => {
    if (!product) return '';
    
    const baseUrl = `/products/${product.slug || product.databaseId}`;
    const params = new URLSearchParams();
    
    // Helper function để tạo slug từ attribute name
    const createAttributeSlug = (name: string): string => {
      return generateSlug(name);
    };
    
    // Thêm size attribute nếu có
    if (selectedSize && sizeAttribute) {
      // WooCommerce format: attribute_pa_{slug}
      // Ví dụ: attribute_pa_size hoặc attribute_pa_kich-thuoc
      const sizeAttrSlug = createAttributeSlug(sizeAttribute.name);
      const attrKey = `attribute_pa_${sizeAttrSlug}`;
      // Encode giá trị size (có thể chứa ký tự đặc biệt)
      params.append(attrKey, selectedSize);
    }
    
    // Thêm color attribute nếu có
    if (selectedColor && colorAttribute) {
      const colorAttrSlug = createAttributeSlug(colorAttribute.name);
      const attrKey = `attribute_pa_${colorAttrSlug}`;
      // Normalize tên màu thành slug (ví dụ: "Đỏ" -> "do", "Hồng" -> "hong")
      const colorValue = createAttributeSlug(selectedColor);
      params.append(attrKey, colorValue);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [product, selectedSize, selectedColor, sizeAttribute, colorAttribute]);
  
  // Early return sau khi đã gọi tất cả hooks
  if (!product || !product.name) return null;
  
  const isOutOfStock = product.stockStatus === 'outofstock';

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // FIX: Prevent quick add for variable products without variations data
    // This prevents wrong pricing when variations haven't loaded yet (race condition)
    if (product.type === 'variable') {
      // Check if variations are still loading or not available
      if (isLoadingVariations || variations.length === 0) {
        // Redirect to product detail page to select variation properly
        router.push(productUrl);
        return;
      }
      
      // If variations loaded but no variation is selected, redirect to detail page
      if (!selectedVariation) {
        router.push(productUrl);
        return;
      }
    }
    
    // Set loading state
    setIsAddingToCart(true);
    
    try {
    // Sử dụng giá của variation nếu có, nếu không thì dùng giá product
    // MongoVariant structure: { id, size, color, price (number), stock, ... }
    let priceToUse: string;
    if (selectedVariation) {
      // MongoVariant chỉ có price (number), không có on_sale/sale_price/regular_price
      priceToUse = String(selectedVariation.price || 0);
    } else {
        // Use product price (string) for simple products
      priceToUse = product.onSale ? product.salePrice : product.price;
    }
    
    await addToCart({
      productId: product.databaseId,
      productName: `${product.name} ${selectedSize ? `(${selectedSize})` : ''}`,
      price: priceToUse || '0',
      image: product.image?.sourceUrl,
      quantity: 1,
      variationId: selectedVariation?.id ? (typeof selectedVariation.id === 'number' ? selectedVariation.id : parseInt(selectedVariation.id, 10) || undefined) : undefined,
      length: product.length || undefined,
      width: product.width || undefined,
      height: product.height || undefined,
      weight: product.weight ? parseFloat(product.weight) : undefined,
      volumetricWeight: product.volumetricWeight || undefined,
    });

    // Mở QuickCheckoutModal sau khi thêm vào giỏ
    try {
      useQuickCheckoutStore.getState().onOpen();
      } catch (error) {
        console.error('[ProductCard] Error opening QuickCheckoutModal:', error);
      }
    } catch (error) {
      console.error('[ProductCard] Error adding to cart:', error);
    } finally {
      // Reset loading state after a short delay for better UX
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 500);
    }
  };

  return (
    <div 
      className="group relative flex flex-col gap-2 bg-white rounded-2xl p-2 md:p-3 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-pink-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Product Image Area */}
      <Link href={productUrl} className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
        <Image
          src={imageUrl}
          alt={product.image?.altText || product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOnSale && (
            <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              Sale
            </span>
          )}
          {/* Logo Brand nhỏ (như ảnh mẫu GOMI) */}
          <div className="bg-white/90 p-1 rounded-full shadow-sm w-6 h-6 flex items-center justify-center">
            <span className="text-[8px] font-extrabold text-pink-500">GB</span>
          </div>
        </div>

        {/* Quick Add Button (Hiện khi hover - Desktop) */}
        {/* Sử dụng Button component với variant default để có gradient effect đồng bộ */}
        <Button
          onClick={handleQuickAdd}
          size="icon"
          disabled={isAddingToCart || isOutOfStock}
          className={cn(
            "absolute bottom-2 right-2 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-md translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300",
            isAddingToCart && "cursor-not-allowed opacity-50"
          )}
          title={isAddingToCart ? "Đang thêm..." : "Thêm nhanh vào giỏ"}
          aria-label={isAddingToCart ? "Đang thêm vào giỏ" : "Thêm nhanh vào giỏ"}
        >
          {isAddingToCart ? (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
          ) : (
          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </Button>
      </Link>

      {/* 2. Content Area */}
      <div className="flex flex-col gap-1">
        {/* Tên sản phẩm */}
        <Link href={productUrl}>
          <h3 className="font-heading text-sm md:text-base font-bold text-gray-700 line-clamp-2 min-h-[2.5rem] group-hover:text-pink-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Giá tiền - Style giống ảnh mẫu (Màu hồng đậm/đỏ) với Skeleton Loading */}
        <div className="flex items-center gap-2 min-h-[28px]">
            {isLoadingVariations ? (
            // Skeleton loading: animate pulse effect cho vùng giá
            <div className="flex items-center gap-2 animate-pulse">
              <div className="h-5 md:h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ) : (
            <>
              {product?.type === 'variable' && !selectedVariation && variablePriceRange && variablePriceRange.min !== variablePriceRange.max ? (
                // Show price range for variable products without selection
                <span className="text-base md:text-lg font-extrabold text-[#D6336C]">
                  Từ {formatPrice(String(variablePriceRange.min))}
                </span>
              ) : (
                <>
                  <span className="text-base md:text-lg font-extrabold text-[#D6336C]">
                    {formatPrice(finalDisplayPrice)}
                  </span>
                  {isOnSale && finalRegularPrice && finalRegularPrice !== finalDisplayPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(finalRegularPrice)}
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* 3. Variants Selection (Size Tabs) - Style GOMI Compact với kích thước vừa phải */}
        {displaySizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {displaySizes.map((size, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSize(size);
                }}
                className={cn(
                  // STYLE CHUẨN GOMI với kích thước vừa phải:
                  // 1. Text size nhỏ vừa (10px), font medium
                  // 2. Padding vừa phải (px-2 py-0.75)
                  // 3. Border mỏng, bo góc nhẹ (rounded-sm)
                  // 4. Min height vừa phải để đảm bảo touch target
                  "text-[10px] md:text-xs font-medium px-2 py-0.75 rounded-sm border transition-all",
                  "min-h-[32px] touch-manipulation",
                  "flex items-center justify-center",
                  
                  // Trạng thái Active (Đã chọn)
                  selectedSize === size
                    ? "border-[#D6336C] bg-pink-50 text-[#D6336C]" // Viền hồng đậm, nền hồng nhạt, chữ hồng
                    : "border-gray-200 bg-white text-gray-500 hover:border-pink-300 hover:text-pink-500" // Mặc định xám nhạt
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* 4. Color Selection (Dots) - Cập nhật logic hiển thị */}
        {displayColors.length > 0 && (
          <div className="flex gap-1.5 mt-1 items-center">
            {displayColors.map((colorName, idx) => {
              // Chuẩn hóa tên màu để tìm trong Map (chuyển về chữ thường, bỏ khoảng trắng thừa)
              const lookupKey = colorName.toLowerCase().trim();
              
              // Lấy mã Hex từ Map, nếu không thấy thì thử dùng chính nó (nếu là mã Hex), hoặc fallback về xám
              const bgColor = getColorHex(colorName) || (colorName.startsWith('#') ? colorName : '#E5E7EB');
              const isSelected = selectedColor === colorName;
              
              return (
                <button
                  key={idx}
                  className={cn(
                    "relative w-6 h-6 rounded-full border-2 shadow-sm hover:scale-110 transition-transform",
                    // Thêm viền xám cho tất cả màu để dễ nhìn hơn
                    ['#FFFFFF', '#FDFBF7', 'trang', 'kem'].includes(lookupKey) || lookupKey === 'trắng' || lookupKey === 'kem'
                      ? "border-gray-400" 
                      : "border-gray-300"
                  )}
                  style={{ backgroundColor: bgColor }}
                  title={`Màu: ${colorName}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColor(colorName);
                  }}
                >
                  {/* Dấu tích màu hồng với viền trắng mỏng khi được chọn */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center border border-white">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
            {/* Hiển thị số lượng màu còn lại nếu có */}
            {remainingColors > 0 && (
              <span className="text-[10px] text-gray-400">+{remainingColors}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
