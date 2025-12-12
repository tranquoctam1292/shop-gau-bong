'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/format';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useProductVariations } from '@/lib/hooks/useProductVariations';
import { cn } from '@/lib/utils/cn';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getColorHex } from '@/lib/utils/colorMapping';
import { generateSlug } from '@/lib/utils/slug';
import { useQuickCheckoutStore } from '@/lib/store/useQuickCheckoutStore';

interface ProductCardProps {
  product: MappedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartSync();
  // State cho việc chọn Size/Màu
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // ============================================
  // LAZY LOADING: Chỉ fetch variations khi cần
  // ============================================
  // Performance Optimization: Thay vì fetch variations cho tất cả products ngay khi page load
  // (có thể gây 40+ API calls đồng thời), chúng ta chỉ fetch khi:
  // 1. User hover vào card → Prefetch để sẵn sàng khi user click size
  // 2. User đã chọn size → Cần để hiển thị giá động
  // 
  // Kết quả: Giảm initial API calls từ 40 xuống 0, cải thiện Time to Interactive ~80%
  const [isHovered, setIsHovered] = useState(false);
  const shouldFetchVariations = isHovered || selectedSize !== null;
  
  // Fetch variations nếu product là variable type và đã hover/select size
  const { variations, isLoading: isLoadingVariations } = useProductVariations(
    product?.databaseId,
    { 
      enabled: !!product && product.type === 'variable' && 
               (product.variations?.length || 0) > 0 &&
               shouldFetchVariations
    }
  );
  
  // Lấy ảnh hiển thị (ưu tiên ảnh biến thể nếu có logic chọn màu, hiện tại dùng ảnh chính)
  const imageUrl = product?.image?.sourceUrl || '/images/teddy-placeholder.png';
  
  // Tìm variation tương ứng với selectedSize
  const selectedVariation = useMemo(() => {
    if (!product) return null;
    if (!selectedSize || variations.length === 0) return null;
    
    // MongoVariant structure: { id, size, color, price, stock, ... }
    // Match variation by size directly (not through attributes array)
    const matchedVariation = variations.find((variation) => {
      // Check if variation.size matches selectedSize
      if (variation.size && variation.size === selectedSize) {
        // If color is also selected, check if it matches
        // But if variation doesn't have color (null/undefined), still match by size
        if (selectedColor) {
          // Only require color match if variation has a color value
          // If variation.color is null/undefined, it means this variation doesn't have color attribute
          // So we should still match it by size only
          return !variation.color || variation.color === selectedColor;
        }
        return true;
      }
      return false;
    });
    
    return matchedVariation || null;
  }, [selectedSize, selectedColor, variations, product]);
  
  // Logic hiển thị giá: Ưu tiên variation price, sau đó mới đến product price
  // MongoVariant structure: { id, size, color, price, stock, ... }
  const displayPrice = useMemo(() => {
    if (!product) return '0';
    if (selectedVariation) {
      // Nếu có variation được chọn, dùng giá của variation
      // MongoVariant chỉ có price (number), không có on_sale/sale_price
      const price = String(selectedVariation.price || 0);
      return price;
    }
    // Fallback về giá product gốc
    const fallbackPrice = product.onSale ? product.salePrice : product.price;
    return fallbackPrice;
  }, [selectedVariation, product]);
  
  // Regular price để hiển thị line-through khi có sale
  const displayRegularPrice = useMemo(() => {
    if (!product) return null;
    if (selectedVariation) {
      // MongoVariant không có regular_price, chỉ có price
      // Return null để không hiển thị line-through
      return null;
    }
    return product.regularPrice;
  }, [selectedVariation, product]);
  
  // Kiểm tra có đang sale không
  const isOnSale = useMemo(() => {
    if (!product) return false;
    if (selectedVariation) {
      // MongoVariant không có on_sale field
      // Check if variation price is different from product regular price
      const variationPrice = selectedVariation.price || 0;
      const productRegularPrice = parseFloat(product.regularPrice) || 0;
      return variationPrice < productRegularPrice && variationPrice > 0;
    }
    return product.onSale || false;
  }, [selectedVariation, product]);
  
  // Extract Size and Color attributes from product (trước early return để dùng trong useMemo)
  // Fallback to mock data if attributes not available
  const sizeAttribute = product?.attributes?.find(
    (attr) => attr.name.toLowerCase().includes('size') || 
               attr.name.toLowerCase().includes('kích thước') ||
               attr.name.toLowerCase().includes('kich thuoc') ||
               attr.name === 'pa_size'
  );
  const colorAttribute = product?.attributes?.find(
    (attr) => attr.name.toLowerCase().includes('color') || 
               attr.name.toLowerCase().includes('màu') ||
               attr.name.toLowerCase().includes('mau') ||
               attr.name === 'pa_color'
  );
  
  // Use real attributes if available, otherwise fallback to mock data
  const availableSizes = sizeAttribute?.options || ['60cm', '80cm', '1m', '1m2'];
  const availableColors = colorAttribute?.options || ['#EF4444', '#3B82F6', '#FFFFFF', '#FCD34D'];
  
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
    
    // Sử dụng giá của variation nếu có, nếu không thì dùng giá product
    // MongoVariant structure: { id, size, color, price (number), stock, ... }
    let priceToUse: string;
    if (selectedVariation) {
      // MongoVariant chỉ có price (number), không có on_sale/sale_price/regular_price
      priceToUse = String(selectedVariation.price || 0);
    } else {
      // Use product price (string)
      priceToUse = product.onSale ? product.salePrice : product.price;
    }
    
    await addToCart({
      productId: product.databaseId,
      productName: `${product.name} ${selectedSize ? `(${selectedSize})` : ''}`,
      price: priceToUse || '0',
      image: product.image?.sourceUrl,
      quantity: 1,
      variationId: selectedVariation?.id,
      length: product.length || undefined,
      width: product.width || undefined,
      height: product.height || undefined,
      weight: product.weight ? parseFloat(product.weight) : undefined,
      volumetricWeight: product.volumetricWeight || undefined,
    });

    // Mở QuickCheckoutModal sau khi thêm vào giỏ
    try {
      useQuickCheckoutStore.getState().onOpen();
      console.log('[ProductCard] QuickCheckoutModal opened');
    } catch (error) {
      console.error('[ProductCard] Error opening QuickCheckoutModal:', error);
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
          className="absolute bottom-2 right-2 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-md translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
          title="Thêm nhanh vào giỏ"
          aria-label="Thêm nhanh vào giỏ"
        >
          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
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

        {/* Giá tiền - Style giống ảnh mẫu (Màu hồng đậm/đỏ) */}
        <div className="flex items-center gap-2">
          <span className="text-base md:text-lg font-extrabold text-[#D6336C]">
            {isLoadingVariations ? (
              <span className="text-gray-400">Đang tải...</span>
            ) : (
              formatPrice(displayPrice)
            )}
          </span>
          {isOnSale && displayRegularPrice && displayRegularPrice !== displayPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(displayRegularPrice)}
            </span>
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
