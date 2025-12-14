import { useMemo } from 'react';
import type { MappedProduct } from '@/lib/utils/productMapper';
import type { MongoVariant } from '@/lib/hooks/useProductVariations';

/**
 * Result type for useProductPrice hook
 */
export interface UseProductPriceResult {
  /** Price to display (string format for consistency with existing code) */
  displayPrice: string;
  /** Regular price (before any discounts) */
  regularPrice: string;
  /** Regular price for display (alias for components using displayRegularPrice) */
  displayRegularPrice: string | null;
  /** Sale price (if on sale) */
  salePrice: string;
  /** Whether product is on sale */
  isOnSale: boolean;
  /** Discount percentage (0-100) */
  discountPercentage: number;
  /** Price range for variable products (min-max) */
  priceRange?: { min: number; max: number };
}

/**
 * Custom hook to calculate product pricing
 * 
 * Handles price calculation for both simple and variable products.
 * MongoDB Variants only have `price` field (number), not sale_price/regular_price.
 * 
 * @param product - Product data from API
 * @param selectedVariation - Selected variation (if any)
 * @returns Pricing information (displayPrice, isOnSale, discountPercentage, etc.)
 * 
 * @example
 * ```typescript
 * const { displayPrice, isOnSale, discountPercentage } = useProductPrice(
 *   product,
 *   selectedVariation
 * );
 * ```
 * 
 * ⚠️ IMPORTANT: MongoDB Variants structure:
 * - Variants only have `price` field (number)
 * - NO `on_sale`, `sale_price`, `regular_price` fields in variants
 * - Product level has salePrice and regularPrice
 */
export function useProductPrice(
  product: MappedProduct | null,
  selectedVariation?: MongoVariant | null
): UseProductPriceResult {
  // Calculate display price
  const displayPrice = useMemo(() => {
    if (!product) return '0';
    
    // If variation is selected, use variation price
    if (selectedVariation) {
      // MongoVariant only has price field (number)
      return String(selectedVariation.price || 0);
    }
    
    // For variable products without selected variation, use minPrice or price range
    if (product.type === 'variable') {
      // Use minPrice if available (calculated from variations)
      if (product.minPrice && product.minPrice > 0) {
        return String(product.minPrice);
      }
      // Fallback to 0 (frontend should show price range or "Từ X đ")
      return '0';
    }
    
    // For simple products, use product price
    // Product can have salePrice if on sale, or regular price
    return product.onSale ? product.salePrice : product.price;
  }, [product, selectedVariation]);

  // Calculate regular price
  const regularPrice = useMemo(() => {
    if (!product) return '0';
    
    // For variable products, regularPrice should not be used
    // Use variation price or minPrice instead
    if (product.type === 'variable') {
      if (selectedVariation) {
        // For selected variation, use its price as regular price
        return String(selectedVariation.price || 0);
      }
      // For variable products without selection, use minPrice
      return product.minPrice && product.minPrice > 0 ? String(product.minPrice) : '0';
    }
    
    // For simple products, use regularPrice field
    return product.regularPrice;
  }, [product, selectedVariation]);

  // Calculate sale price
  const salePrice = useMemo(() => {
    if (!product) return '';
    
    // Variations don't have sale_price field
    // Check if variation price is lower than product regular price
    if (selectedVariation) {
      const variationPrice = selectedVariation.price || 0;
      const productRegularPrice = parseFloat(product.regularPrice) || 0;
      
      if (variationPrice < productRegularPrice && variationPrice > 0) {
        return String(variationPrice);
      }
      return '';
    }
    
    // For product, use salePrice field
    return product.salePrice || '';
  }, [product, selectedVariation]);

  // Calculate if on sale
  const isOnSale = useMemo(() => {
    if (!product) return false;
    
    // For variations
    if (selectedVariation) {
      const variationPrice = selectedVariation.price || 0;
      const productRegularPrice = parseFloat(product.regularPrice) || 0;
      
      // Consider on sale if variation price is lower than product regular price
      return variationPrice < productRegularPrice && variationPrice > 0;
    }
    
    // For product, use onSale field
    return product.onSale || false;
  }, [product, selectedVariation]);

  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    if (!isOnSale) return 0;
    
    const regular = parseFloat(regularPrice) || 0;
    const display = parseFloat(displayPrice) || 0;
    
    if (regular <= 0 || display <= 0) return 0;
    if (display >= regular) return 0;
    
    return Math.round(((regular - display) / regular) * 100);
  }, [isOnSale, regularPrice, displayPrice]);

  // Calculate price range for variable products
  const priceRange = useMemo(() => {
    if (!product) return undefined;
    
    // Only calculate for products with minPrice/maxPrice
    if (product.minPrice !== undefined && product.maxPrice !== undefined) {
      return {
        min: product.minPrice,
        max: product.maxPrice,
      };
    }
    
    return undefined;
  }, [product]);

  return {
    displayPrice,
    regularPrice,
    displayRegularPrice: regularPrice, // Alias for backward compatibility
    salePrice,
    isOnSale,
    discountPercentage,
    priceRange,
  };
}

/**
 * Example usage in components:
 * 
 * ```typescript
 * import { useProductPrice } from '@/lib/hooks/useProductPrice';
 * import { formatPrice } from '@/lib/utils/format';
 * 
 * function ProductCard({ product }) {
 *   const [selectedSize, setSelectedSize] = useState(null);
 *   const { variations } = useProductVariations(product.databaseId);
 *   const selectedVariation = variations.find(v => v.size === selectedSize);
 *   
 *   // Use hook to get pricing
 *   const { displayPrice, isOnSale, discountPercentage } = useProductPrice(
 *     product,
 *     selectedVariation
 *   );
 *   
 *   return (
 *     <div>
 *       <p className="text-2xl font-bold">
 *         {formatPrice(displayPrice)}
 *       </p>
 *       {isOnSale && (
 *         <span className="badge">-{discountPercentage}%</span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
