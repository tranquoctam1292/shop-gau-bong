'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useProductVariations } from '@/lib/hooks/useProductVariations';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { getColorHex } from '@/lib/utils/colorMapping';
import { cn } from '@/lib/utils/cn';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { Gift, ShoppingCart, Check, Loader2, Zap } from 'lucide-react';
import { useQuickCheckoutStore } from '@/lib/store/useQuickCheckoutStore';

interface ProductInfoProps {
  product: MappedProduct;
  onAddToCart?: (variationId?: number, isGift?: boolean) => void;
  onGiftOrder?: () => void;
}

export function ProductInfo({ product, onAddToCart, onGiftOrder }: ProductInfoProps) {
  const { addToCart } = useCartSync();
  const searchParams = useSearchParams();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addingType, setAddingType] = useState<'gift' | 'buy' | 'quick' | null>(null);

  // Fetch variations if product is variable type
  // Always call useProductVariations with consistent signature to avoid hooks violation
  const productId = product?.databaseId ?? null;
  const shouldFetchVariations = product?.type === 'variable' && (product?.variations?.length || 0) > 0;
  const { variations, isLoading: isLoadingVariations } = useProductVariations(
    productId,
    { enabled: shouldFetchVariations && !!productId }
  );

  // Find selected variation based on selectedSize
  const selectedVariation = useMemo(() => {
    if (!product || !selectedSize || variations.length === 0) return null;
    
    const sizeAttribute = product.attributes?.find(
      (attr) => attr.name.toLowerCase().includes('size') || 
                 attr.name.toLowerCase().includes('kích thước') ||
                 attr.name.toLowerCase().includes('kich thuoc')
    );
    
    if (!sizeAttribute) return null;
    
    return variations.find((variation) => {
      const sizeAttr = variation.attributes.find(
        (attr) => attr.id === sizeAttribute.id || 
                  attr.name.toLowerCase() === sizeAttribute.name.toLowerCase()
      );
      return sizeAttr && sizeAttr.option === selectedSize;
    }) || null;
  }, [selectedSize, variations, product]);

  // Dynamic pricing
  const displayPrice = useMemo(() => {
    if (!product) return '0';
    if (selectedVariation) {
      return selectedVariation.on_sale && selectedVariation.sale_price
        ? selectedVariation.sale_price
        : selectedVariation.price || selectedVariation.regular_price;
    }
    return product.onSale ? product.salePrice : product.price;
  }, [selectedVariation, product]);

  const displayRegularPrice = useMemo(() => {
    if (!product) return null;
    if (selectedVariation) {
      return selectedVariation.regular_price;
    }
    return product.regularPrice;
  }, [selectedVariation, product]);

  const isOnSale = useMemo(() => {
    if (!product) return false;
    if (selectedVariation) {
      return selectedVariation.on_sale || false;
    }
    return product.onSale;
  }, [selectedVariation, product]);

  // Extract Size and Color attributes (trước early return để dùng trong useEffect)
  const sizeAttribute = product?.attributes?.find(
    (attr) => attr.name.toLowerCase().includes('size') || 
               attr.name.toLowerCase().includes('kích thước') ||
               attr.name.toLowerCase().includes('kich thuoc')
  );
  const colorAttribute = product?.attributes?.find(
    (attr) => attr.name.toLowerCase().includes('color') || 
               attr.name.toLowerCase().includes('màu') ||
               attr.name.toLowerCase().includes('mau')
  );

  const availableSizes = sizeAttribute?.options || [];
  const availableColors = colorAttribute?.options || [];

  const displaySizes = availableSizes.slice(0, 4);
  const displayColors = availableColors.slice(0, 4);

  // Đọc query params từ URL và tự động chọn size/color
  useEffect(() => {
    if (!product || !product.attributes) return;

    // Helper function để tạo slug từ attribute name (giống logic trong ProductCard)
    const createAttributeSlug = (name: string): string => {
      return name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    };

    // Tìm size attribute và đọc từ URL
    if (sizeAttribute) {
      const sizeAttrSlug = createAttributeSlug(sizeAttribute.name);
      const attrKey = `attribute_pa_${sizeAttrSlug}`;
      const sizeFromUrl = searchParams.get(attrKey);
      
      if (sizeFromUrl && availableSizes.includes(sizeFromUrl)) {
        setSelectedSize(sizeFromUrl);
      }
    }

    // Tìm color attribute và đọc từ URL
    if (colorAttribute) {
      const colorAttrSlug = createAttributeSlug(colorAttribute.name);
      const attrKey = `attribute_pa_${colorAttrSlug}`;
      const colorFromUrl = searchParams.get(attrKey);
      
      if (colorFromUrl) {
        // Tìm màu khớp (có thể là slug hoặc tên đầy đủ)
        const matchedColor = availableColors.find((color) => {
          const colorSlug = createAttributeSlug(color);
          return colorSlug === colorFromUrl || color.toLowerCase() === colorFromUrl.toLowerCase();
        });
        
        if (matchedColor) {
          setSelectedColor(matchedColor);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, product, sizeAttribute, colorAttribute]);

  if (!product || !product.name) return null;

  const isOutOfStock = product.stockStatus === 'outofstock';

  const handleAddToCartClick = async (isGift: boolean = false, isQuickCheckout: boolean = false) => {
    // Validation: Nếu product có variations nhưng chưa chọn size
    // Tự động chọn size đầu tiên và tiếp tục thêm vào giỏ (không return)
    if (product.type === 'variable' && availableSizes.length > 0 && !selectedSize) {
      if (availableSizes.length > 0) {
        setSelectedSize(availableSizes[0]);
        // KHÔNG return - để code tiếp tục chạy và thêm vào giỏ ngay trong lần bấm đầu tiên
      }
    }

    setIsAdding(true);
    setAddingType(isGift ? 'gift' : isQuickCheckout ? 'quick' : 'buy');

    try {
      const priceToUse = selectedVariation 
        ? (selectedVariation.on_sale && selectedVariation.sale_price 
            ? selectedVariation.sale_price 
            : selectedVariation.price || selectedVariation.regular_price)
        : (product.onSale ? product.salePrice : product.price);

      for (let i = 0; i < quantity; i++) {
        await addToCart({
          productId: product.databaseId,
          productName: `${product.name} ${selectedSize ? `(${selectedSize})` : ''}`,
          price: priceToUse || '0',
          image: product.image?.sourceUrl,
          quantity: 1,
          variationId: selectedVariation?.id,
          isGift: isGift,
          length: product.length || undefined,
          width: product.width || undefined,
          height: product.height || undefined,
          weight: product.weight ? parseFloat(product.weight) : undefined,
          volumetricWeight: product.volumetricWeight || undefined,
        });
      }

      if (onAddToCart) {
        onAddToCart(selectedVariation?.id, isGift);
      }

      // Mở QuickCheckoutModal sau khi thêm vào giỏ (cho cả "Thêm giỏ hàng" và "Mua ngay")
      try {
        useQuickCheckoutStore.getState().onOpen();
        console.log('[ProductInfo] QuickCheckoutModal opened');
      } catch (error) {
        console.error('[ProductInfo] Error opening QuickCheckoutModal:', error);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      // Reset loading state after a short delay for better UX
      setTimeout(() => {
        setIsAdding(false);
        setAddingType(null);
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
          {product.name}
        </h1>
        {product.sku && (
          <p className="text-sm text-text-muted">
            SKU: {product.sku}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-4">
        <p className="text-3xl font-bold text-primary">
          {isLoadingVariations ? (
            <span className="text-gray-400">Đang tải...</span>
          ) : (
            formatPrice(displayPrice)
          )}
        </p>
        {isOnSale && displayRegularPrice && displayRegularPrice !== displayPrice && (
          <p className="text-lg text-text-muted line-through">
            {formatPrice(displayRegularPrice)}
          </p>
        )}
      </div>

      {/* Size Selector */}
      {displaySizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            Kích thước
          </label>
          <div className="flex flex-wrap gap-2">
            {displaySizes.map((size, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "text-sm font-medium px-4 py-2 rounded-md border-2 transition-all min-h-[44px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  selectedSize === size
                    ? "border-[#D6336C] bg-pink-50 text-[#D6336C]"
                    : "border-gray-200 bg-white text-gray-500 hover:border-pink-300 hover:text-pink-500"
                )}
                aria-label={`Chọn kích thước ${size}`}
                aria-pressed={selectedSize === size}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {displayColors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            Màu sắc{selectedColor ? `: ${selectedColor}` : ''}
          </label>
          <div className="flex gap-3 items-center">
            {displayColors.map((colorName, idx) => {
              // Lấy mã màu Hex từ tên màu với fallback
              const bgColor = getColorHex(colorName) || (colorName.startsWith('#') ? colorName : '#E5E7EB');
              const isSelected = selectedColor === colorName;
              
              // Xác định màu sáng để chọn màu checkmark tương phản
              // Danh sách màu sáng cần checkmark đen
              const lightColors = ['#FFFFFF', '#FDFBF7', '#F5F5DC', '#E5E7EB', '#FFF9FA', '#FEF3C7'];
              const bgColorUpper = bgColor.toUpperCase();
              const isLightColor = lightColors.includes(bgColorUpper) || 
                                   colorName.toLowerCase().includes('trắng') || 
                                   colorName.toLowerCase().includes('kem') ||
                                   colorName.toLowerCase().includes('trang');
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(colorName)}
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    "border-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    // Style khi được chọn: ring effect và scale
                    isSelected 
                      ? "border-pink-600 ring-2 ring-pink-500 ring-offset-2 scale-110" 
                      : isLightColor
                        ? "border-gray-400 hover:scale-105 hover:border-pink-300"
                        : "border-gray-300 hover:scale-105 hover:border-pink-300"
                  )}
                  style={{ backgroundColor: bgColor }}
                  title={`Màu: ${colorName}`}
                  aria-label={`Chọn màu ${colorName}`}
                  aria-pressed={isSelected}
                >
                  {/* Chỉ hiển thị dấu tích khi được chọn */}
                  {isSelected && (
                    <Check 
                      className={cn(
                        "w-4 h-4 md:w-5 md:h-5", 
                        isLightColor ? "text-gray-900" : "text-white"
                      )} 
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions (Horizontal Layout) */}
      <div className="space-y-4">
        {/* Row of Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Quantity Capsule */}
          <QuantitySelector 
            value={quantity} 
            onChange={setQuantity} 
            min={1}
            max={product.stockQuantity || 99}
            disabled={isOutOfStock}
          />

          {/* 2. Add to Cart Button */}
          <Button 
            className="rounded-full bg-blue-500 hover:bg-blue-600 text-white border-none px-4 md:px-6 h-8 md:h-9 min-h-[44px] text-sm gap-2 shadow-sm shadow-blue-200 font-bold !flex items-center justify-center"
            disabled={isOutOfStock || isAdding}
            onClick={() => handleAddToCartClick(false)}
            aria-label="Thêm vào giỏ hàng"
          >
            {isAdding && addingType === 'buy' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang thêm...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Thêm giỏ hàng</span>
              </>
            )}
          </Button>

          {/* 3. Gift Button */}
          <Button 
            className="rounded-full bg-pink-400 hover:bg-pink-500 text-white border-none px-4 md:px-6 h-8 md:h-9 min-h-[44px] text-sm gap-2 shadow-sm shadow-pink-200 font-bold !flex items-center justify-center"
            disabled={isOutOfStock || isAdding}
            onClick={() => handleAddToCartClick(true)}
            aria-label="Gửi tặng sản phẩm"
          >
            {isAdding && addingType === 'gift' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span className="whitespace-nowrap">Đang thêm...</span>
              </>
            ) : (
              <>
                <Gift className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">GỬI TẶNG</span>
              </>
            )}
          </Button>
        </div>

        {/* Quick Checkout Button - Mua ngay */}
        <Button
          className="w-full rounded-full bg-[#D6336C] hover:bg-[#BE185D] text-white border-none px-6 h-10 md:h-12 min-h-[44px] text-sm md:text-base gap-2 font-bold !flex items-center justify-center"
          disabled={isOutOfStock || isAdding}
          onClick={() => handleAddToCartClick(false, true)}
          aria-label="Mua ngay"
        >
          {isAdding && addingType === 'quick' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="whitespace-nowrap">Đang xử lý...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Mua ngay</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

