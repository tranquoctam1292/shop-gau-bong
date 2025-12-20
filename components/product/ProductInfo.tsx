'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useProductVariations } from '@/lib/hooks/useProductVariations';
import { useVariationMatcher, useSmallestSizeByPrice } from '@/lib/hooks/useVariationMatcher';
import { useProductPrice } from '@/lib/hooks/useProductPrice';
import { useMultipleGlobalAttributeTerms } from '@/lib/hooks/useGlobalAttributes';
import { isAttributeSize, isAttributeColor } from '@/lib/constants/attributes';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { VisualAttributeSelector } from '@/components/product/VisualAttributeSelector';
import { getColorHex } from '@/lib/utils/colorMapping';
import { generateSlug } from '@/lib/utils/slug';
import { cn } from '@/lib/utils/cn';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { Gift, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useQuickCheckoutStore } from '@/lib/store/useQuickCheckoutStore';

interface ProductInfoProps {
  product: MappedProduct;
  onAddToCart?: (variationId?: number, isGift?: boolean) => void;
  onGiftOrder?: () => void;
  onVariationChange?: (variationImage?: string) => void; // Callback khi variation thay đổi
}

export function ProductInfo({ product, onAddToCart, onGiftOrder, onVariationChange }: ProductInfoProps) {
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
  const { variations, isLoading: isLoadingVariations, refetch: refetchVariations } = useProductVariations(
    productId,
    { enabled: shouldFetchVariations && !!productId }
  );
  
  // FIX: Khi user chọn size, đảm bảo variations được fetch ngay nếu chưa có
  useEffect(() => {
    if (selectedSize && product?.type === 'variable' && variations.length === 0 && !isLoadingVariations) {
      refetchVariations();
    }
  }, [selectedSize, product?.type, variations.length, isLoadingVariations, refetchVariations]);

  // Extract Size and Color attributes using centralized constants
  // This replaces hardcoded string matching with reusable helper functions
  const sizeAttribute = product?.attributes?.find((attr) => isAttributeSize(attr.name));
  const colorAttribute = product?.attributes?.find((attr) => isAttributeColor(attr.name));

  // Auto-select smallest size (lowest price) when variations load
  const smallestSize = useSmallestSizeByPrice(variations);
  
  // Use custom hook to find matching variation (replaces ~25 lines of duplicate logic)
  const selectedVariation = useVariationMatcher(variations, selectedSize, selectedColor);

  // Notify parent component when variation image changes
  useEffect(() => {
    if (onVariationChange) {
      onVariationChange(selectedVariation?.image);
    }
  }, [selectedVariation?.image, onVariationChange]);

  // Use custom hook for pricing logic (replaces ~35 lines of duplicate code)
  const { displayPrice, displayRegularPrice, isOnSale } = useProductPrice(product, selectedVariation);

  const availableSizes = sizeAttribute?.options || [];
  const availableColors = colorAttribute?.options || [];

  const displaySizes = availableSizes.slice(0, 4);
  const displayColors = availableColors.slice(0, 4);

  // Fetch global attribute terms if globalAttributeId is available
  // Note: This requires product.attributes to include globalAttributeId (to be added in mapMongoProduct)
  const globalAttributeIds = useMemo(() => {
    const ids: string[] = [];
    product?.attributes?.forEach((attr: any) => {
      if (attr.globalAttributeId) {
        ids.push(attr.globalAttributeId);
      }
    });
    return ids;
  }, [product?.attributes]);

  const { 
    data: globalAttributeTermsData, 
    isLoading: isLoadingGlobalTerms,
    error: globalTermsError 
  } = useMultipleGlobalAttributeTerms(globalAttributeIds);

  // Handle error gracefully - log but don't crash
  useEffect(() => {
    if (globalTermsError) {
      console.error('[ProductInfo] Error loading global attribute terms:', globalTermsError);
      // Fallback to old color mapping will be used automatically
    }
  }, [globalTermsError]);

  // Create a map of globalAttributeId -> terms
  const globalTermsMap = useMemo(() => {
    // If there's an error, return empty map (fallback to old behavior)
    if (globalTermsError || !globalAttributeTermsData || globalAttributeTermsData.length === 0) {
      return new Map<string, any>();
    }
    
    const map = new Map<string, any>();
    globalAttributeTermsData.forEach((data) => {
      if (data?.attribute?.id) {
        map.set(data.attribute.id, data);
      }
    });
    return map;
  }, [globalAttributeTermsData, globalTermsError]);

  // Get global attribute type for an attribute
  const getGlobalAttributeType = (attr: any): 'text' | 'color' | 'image' | 'button' | null => {
    if (!attr.globalAttributeId) return null;
    const termsData = globalTermsMap.get(attr.globalAttributeId);
    return termsData?.attribute.type || null;
  };

  // Get global terms for an attribute
  const getGlobalTerms = (attr: any) => {
    if (!attr.globalAttributeId) return [];
    const termsData = globalTermsMap.get(attr.globalAttributeId);
    return termsData?.terms || [];
  };

  // Đọc query params từ URL và tự động chọn size/color
  // Priority: URL params > Auto-select smallest size
  useEffect(() => {
    if (!product || !product.attributes) return;

    // Helper function để tạo slug từ attribute name
    const createAttributeSlug = (name: string): string => {
      return generateSlug(name);
    };

    let sizeFromUrl: string | null = null;
    
    // Tìm size attribute và đọc từ URL
    if (sizeAttribute) {
      const sizeAttrSlug = createAttributeSlug(sizeAttribute.name);
      const attrKey = `attribute_pa_${sizeAttrSlug}`;
      sizeFromUrl = searchParams.get(attrKey);
      
      if (sizeFromUrl && availableSizes.includes(sizeFromUrl)) {
        setSelectedSize(sizeFromUrl);
        return; // URL param takes priority, don't auto-select
      }
    }
    
    // If no size from URL and variations loaded, auto-select smallest size
    if (!sizeFromUrl && product.type === 'variable' && smallestSize && !selectedSize && !isLoadingVariations && variations.length > 0) {
      setSelectedSize(smallestSize);
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

  // Early return with null/undefined safety check
  // Per .cursorrules: Always handle missing product data gracefully
  if (!product || !product.name) {
    console.warn('[ProductInfo] Product or product.name is missing');
    return null;
  }

  // FIX: Check stock at variant level if variation is selected
  // Variant stock enforcement: If user selects a variant that's out of stock,
  // disable "Add to Cart" button even if product level shows "in stock"
  // SECURITY FIX: Strict stock checking with manageStock validation
  // If variant stock field is missing (due to MongoDB migration), don't default to "in stock"
  // Only consider "in stock" if stock is explicitly > 0
  const isOutOfStock = useMemo(() => {
    // If variation is selected, check variant stock strictly
    if (selectedVariation) {
      // MongoVariant has stock field (number) or stockQuantity field (number)
      // Support both fields for backward compatibility
      const variantStock = selectedVariation.stockQuantity !== undefined 
        ? selectedVariation.stockQuantity 
        : (selectedVariation.stock !== undefined ? selectedVariation.stock : undefined);
      
      // Strict check: Only consider "in stock" if stock is explicitly defined and > 0
      // If stock is undefined/null (missing data from migration), treat as out of stock
      // This prevents defaulting to "in stock" when data is missing
      if (variantStock === undefined || variantStock === null) {
        // Stock field is missing - treat as out of stock for safety
        // This handles cases where MongoDB data is incomplete after migration
        return true;
      }
      
      // Stock is defined - check if it's > 0
      return variantStock <= 0;
    }
    
    // For simple products or no variation selected, check product level stock
    return product.stockStatus === 'outofstock';
  }, [product.stockStatus, selectedVariation]);

  const handleAddToCartClick = async (isGift: boolean = false, isQuickCheckout: boolean = false) => {
    // FIX: Defense in depth - Check stock before adding to cart
    if (isOutOfStock) {
      console.warn('[ProductInfo] Cannot add to cart: Product or variant is out of stock');
      return;
    }

    // FIX: Use local variables to avoid async state update issues
    // If product has variations but no size selected, auto-select first size
    let sizeToUse = selectedSize;
    let colorToUse = selectedColor;
    
    if (product.type === 'variable' && availableSizes.length > 0 && !selectedSize) {
      sizeToUse = availableSizes[0];
      // Update UI state (async) but use local variable for immediate logic
      setSelectedSize(sizeToUse);
    }

    setIsAdding(true);
    setAddingType(isGift ? 'gift' : isQuickCheckout ? 'quick' : 'buy');

    try {
      // Find variation using local variables (not state) to ensure accuracy
      // MongoVariant structure: { id, size, color, price, stock, ... }
      const variationToUse = variations.find((variation) => {
        if (variation.size && variation.size === sizeToUse) {
          if (colorToUse) {
            return !variation.color || variation.color === colorToUse;
          }
          return true;
        }
        return false;
      });

      // FIX: Additional stock check for the found variation (strict validation)
      // Support both stock and stockQuantity fields
      if (variationToUse) {
        const variantStock = variationToUse.stockQuantity !== undefined 
          ? variationToUse.stockQuantity 
          : (variationToUse.stock !== undefined ? variationToUse.stock : undefined);
        
        // Strict check: If stock is missing or <= 0, prevent add to cart
        if (variantStock === undefined || variantStock === null || variantStock <= 0) {
          console.warn('[ProductInfo] Cannot add to cart: Selected variant is out of stock or stock data is missing');
          setIsAdding(false);
          setAddingType(null);
          return;
        }
      }

      // Calculate price using the found variation
      // MongoVariant chỉ có price field, không có on_sale, sale_price, regular_price
      const priceToUse = variationToUse 
        ? String(variationToUse.price || 0)
        : (product.onSale ? product.salePrice : product.price);

      for (let i = 0; i < quantity; i++) {
        await addToCart({
          // FIX: Keep productId as string (MongoDB ObjectId) - don't use parseInt on hex string
          productId: product.databaseId || product.id,
          productName: `${product.name} ${sizeToUse ? `(${sizeToUse})` : ''}`,
          price: priceToUse || '0',
          image: product.image?.sourceUrl,
          quantity: 1,
          // FIX: Keep variationId as string if it's a string (MongoDB variant ID)
          variationId: variationToUse?.id || undefined,
          isGift: isGift,
          length: product.length || undefined,
          width: product.width || undefined,
          height: product.height || undefined,
          weight: product.weight ? parseFloat(product.weight) : undefined,
          volumetricWeight: product.volumetricWeight || undefined,
        });
      }

      if (onAddToCart) {
        // FIX: Pass variationId as-is (string or number) - don't convert
        onAddToCart(variationToUse?.id as number | undefined, isGift);
      }

      // Mở QuickCheckoutModal sau khi thêm vào giỏ
      try {
        useQuickCheckoutStore.getState().onOpen();
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

      {/* Size Selector - Use VisualAttributeSelector if global attribute, otherwise fallback */}
      {displaySizes.length > 0 && sizeAttribute && (
        (() => {
          const globalType = getGlobalAttributeType(sizeAttribute as any);
          const globalTerms = getGlobalTerms(sizeAttribute as any);
          
          // Use VisualAttributeSelector if it's a global attribute with type
          if (globalType) {
            return (
              <VisualAttributeSelector
                label="Kích thước"
                type={globalType}
                options={displaySizes}
                terms={globalTerms}
                selectedValue={selectedSize}
                onSelect={setSelectedSize}
              />
            );
          }
          
          // Fallback to button style for non-global or text attributes
          return (
            <VisualAttributeSelector
              label="Kích thước"
              type="button"
              options={displaySizes}
              selectedValue={selectedSize}
              onSelect={setSelectedSize}
            />
          );
        })()
      )}

      {/* Color Selector - Use VisualAttributeSelector if global attribute, otherwise fallback */}
      {displayColors.length > 0 && colorAttribute && (
        (() => {
          const globalType = getGlobalAttributeType(colorAttribute as any);
          const globalTerms = getGlobalTerms(colorAttribute as any);
          
          // Use VisualAttributeSelector if it's a global attribute with type
          if (globalType) {
            return (
              <VisualAttributeSelector
                label="Màu sắc"
                type={globalType}
                options={displayColors}
                terms={globalTerms}
                selectedValue={selectedColor}
                onSelect={setSelectedColor}
              />
            );
          }
          
          // Fallback to color swatches using getColorHex (backward compatibility)
          return (
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Màu sắc{selectedColor ? `: ${selectedColor}` : ''}
              </label>
              <div className="flex gap-3 items-center">
                {displayColors.map((colorName, idx) => {
                  const bgColor = getColorHex(colorName) || (colorName.startsWith('#') ? colorName : '#E5E7EB');
                  const isSelected = selectedColor === colorName;
                  
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
          );
        })()
      )}

      {/* Actions (Horizontal Layout) */}
      <div className="space-y-4">
        {/* Row of Actions - Responsive flex with shrink */}
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap overflow-hidden">
          {/* 1. Quantity Capsule - Fixed width, no shrink */}
          <div className="flex-shrink-0">
            <QuantitySelector 
              value={quantity} 
              onChange={setQuantity} 
              min={1}
              max={product.stockQuantity || 99}
              disabled={isOutOfStock}
            />
          </div>

          {/* 2. Add to Cart Button - Flexible, can shrink */}
          <Button 
            className="rounded-full bg-blue-500 hover:bg-blue-600 text-white border-none px-2 sm:px-4 md:px-6 h-8 md:h-9 min-h-[44px] text-xs sm:text-sm gap-1 sm:gap-2 shadow-sm shadow-blue-200 font-bold !flex items-center justify-center flex-1 min-w-0"
            disabled={isOutOfStock || isAdding}
            onClick={() => handleAddToCartClick(false)}
            aria-label="Thêm vào giỏ hàng"
          >
            {isAdding && addingType === 'buy' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span className="truncate">Đang thêm...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">Thêm giỏ hàng</span>
              </>
            )}
          </Button>

          {/* 3. Gift Button - Flexible, can shrink */}
          <Button 
            className="rounded-full bg-pink-400 hover:bg-pink-500 text-white border-none px-2 sm:px-4 md:px-6 h-8 md:h-9 min-h-[44px] text-xs sm:text-sm gap-1 sm:gap-2 shadow-sm shadow-pink-200 font-bold !flex items-center justify-center flex-1 min-w-0"
            disabled={isOutOfStock || isAdding}
            onClick={() => handleAddToCartClick(true)}
            aria-label="Gửi tặng sản phẩm"
          >
            {isAdding && addingType === 'gift' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span className="truncate">Đang thêm...</span>
              </>
            ) : (
              <>
                <Gift className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">GỬI TẶNG</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

