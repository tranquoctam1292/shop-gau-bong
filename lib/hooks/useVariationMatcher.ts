import { useMemo } from 'react';
import type { MongoVariant } from '@/lib/hooks/useProductVariations';

/**
 * Custom hook to find matching variation based on selected attributes
 * 
 * ⚠️ CRITICAL: MongoDB Variants structure
 * - Variants have direct fields: size, color (NOT an attributes object)
 * - Match by variation.size === selectedSize (NOT through variation.attributes)
 * - Color is optional (some variations may not have color)
 * 
 * @param variations - Array of product variations from useProductVariations
 * @param selectedSize - Currently selected size (e.g., "60cm", "80cm")
 * @param selectedColor - Currently selected color (optional)
 * @returns Matched variation or null
 * 
 * @example
 * ```typescript
 * const { variations } = useProductVariations(productId);
 * const matchedVariation = useVariationMatcher(
 *   variations,
 *   selectedSize,
 *   selectedColor
 * );
 * 
 * if (matchedVariation) {
 *   console.log('Price:', matchedVariation.price);
 *   console.log('Stock:', matchedVariation.stock);
 * }
 * ```
 */
export function useVariationMatcher(
  variations: MongoVariant[],
  selectedSize: string | null,
  selectedColor?: string | null
): MongoVariant | null {
  return useMemo(() => {
    // Early return if no size selected or no variations
    if (!selectedSize || variations.length === 0) {
      return null;
    }

    // Normalize selected size for comparison (trim and lowercase)
    const normalizedSelectedSize = selectedSize.trim().toLowerCase();
    const normalizedSelectedColor = selectedColor?.trim().toLowerCase();

    // Find variation that matches selected size and color
    const matchedVariation = variations.find((variation) => {
      // Variation must have a size field
      if (!variation.size) return false;

      // Normalize variation size for comparison
      const normalizedVariationSize = variation.size.trim().toLowerCase();

      // Check if size matches
      if (normalizedVariationSize !== normalizedSelectedSize) {
        return false;
      }

      // If color is selected, check color match
      if (normalizedSelectedColor) {
        // If variation doesn't have color (null/undefined), 
        // it means this variation doesn't support color attribute
        // In this case, we still match by size only
        if (!variation.color) {
          return true;
        }

        // If variation has color, it must match selected color
        const normalizedVariationColor = variation.color.trim().toLowerCase();
        return normalizedVariationColor === normalizedSelectedColor;
      }

      // Size matches and no color requirement
      return true;
    });

    return matchedVariation || null;
  }, [variations, selectedSize, selectedColor]);
}

/**
 * Alternative version without normalization (exact match)
 * Use this if your data is already normalized in the database
 * 
 * @param variations - Array of product variations
 * @param selectedSize - Selected size (exact match)
 * @param selectedColor - Selected color (exact match, optional)
 * @returns Matched variation or null
 */
export function useVariationMatcherExact(
  variations: MongoVariant[],
  selectedSize: string | null,
  selectedColor?: string | null
): MongoVariant | null {
  return useMemo(() => {
    if (!selectedSize || variations.length === 0) {
      return null;
    }

    const matchedVariation = variations.find((variation) => {
      if (!variation.size || variation.size !== selectedSize) {
        return false;
      }

      if (selectedColor) {
        return !variation.color || variation.color === selectedColor;
      }

      return true;
    });

    return matchedVariation || null;
  }, [variations, selectedSize, selectedColor]);
}

/**
 * Hook to get all unique sizes from variations
 * Useful for displaying size selector
 * 
 * @param variations - Array of product variations
 * @returns Array of unique size values
 * 
 * @example
 * ```typescript
 * const { variations } = useProductVariations(productId);
 * const availableSizes = useAvailableSizes(variations);
 * // Returns: ["60cm", "80cm", "1m", "1m2"]
 * ```
 */
export function useAvailableSizes(variations: MongoVariant[]): string[] {
  return useMemo(() => {
    if (variations.length === 0) return [];

    // Extract unique sizes, filter out empty/null values
    const sizes = variations
      .map((v) => v.size)
      .filter((size): size is string => Boolean(size && String(size).trim().length > 0))
      .map((size) => String(size).trim());

    // Remove duplicates using Set
    return [...new Set(sizes)];
  }, [variations]);
}

/**
 * Hook to get all unique colors from variations
 * Useful for displaying color selector
 * 
 * @param variations - Array of product variations
 * @returns Array of unique color values
 * 
 * @example
 * ```typescript
 * const { variations } = useProductVariations(productId);
 * const availableColors = useAvailableColors(variations);
 * // Returns: ["Đỏ", "Xanh", "Trắng"]
 * ```
 */
export function useAvailableColors(variations: MongoVariant[]): string[] {
  return useMemo(() => {
    if (variations.length === 0) return [];

    // Extract unique colors, filter out empty/null values
    const colors = variations
      .map((v) => v.color)
      .filter((color): color is string => Boolean(color && String(color).trim().length > 0))
      .map((color) => String(color).trim());

    // Remove duplicates using Set
    return [...new Set(colors)];
  }, [variations]);
}

/**
 * Hook to find the size with the lowest price (smallest size)
 * Useful for auto-selecting default size when variations load
 * 
 * @param variations - Array of product variations
 * @returns Size string with lowest price, or null if no variations
 * 
 * @example
 * ```typescript
 * const { variations } = useProductVariations(productId);
 * const defaultSize = useSmallestSizeByPrice(variations);
 * // Returns: "25cm" (if that size has the lowest price)
 * ```
 */
export function useSmallestSizeByPrice(variations: MongoVariant[]): string | null {
  return useMemo(() => {
    if (variations.length === 0) return null;

    // Filter variations with valid price and size
    const validVariations = variations.filter(
      (v) => v.size && v.price !== undefined && v.price !== null && v.price > 0
    );

    if (validVariations.length === 0) return null;

    // Find variation with lowest price
    const lowestPriceVariation = validVariations.reduce((min, current) => {
      return (current.price || 0) < (min.price || 0) ? current : min;
    });

    return lowestPriceVariation.size || null;
  }, [variations]);
}

/**
 * Example usage in ProductCard or ProductInfo:
 * 
 * ```typescript
 * import { useProductVariations } from '@/lib/hooks/useProductVariations';
 * import { useVariationMatcher, useAvailableSizes, useAvailableColors } from '@/lib/hooks/useVariationMatcher';
 * 
 * function ProductInfo({ product }) {
 *   const [selectedSize, setSelectedSize] = useState<string | null>(null);
 *   const [selectedColor, setSelectedColor] = useState<string | null>(null);
 *   
 *   // Fetch variations
 *   const { variations, isLoading } = useProductVariations(product.databaseId);
 *   
 *   // Get available options
 *   const availableSizes = useAvailableSizes(variations);
 *   const availableColors = useAvailableColors(variations);
 *   
 *   // Find matched variation
 *   const selectedVariation = useVariationMatcher(
 *     variations,
 *     selectedSize,
 *     selectedColor
 *   );
 *   
 *   return (
 *     <div>
 *       {availableSizes.map(size => (
 *         <button
 *           key={size}
 *           onClick={() => setSelectedSize(size)}
 *           className={selectedSize === size ? 'active' : ''}
 *         >
 *           {size}
 *         </button>
 *       ))}
 *       
 *       {availableColors.map(color => (
 *         <button
 *           key={color}
 *           onClick={() => setSelectedColor(color)}
 *           className={selectedColor === color ? 'active' : ''}
 *         >
 *           {color}
 *         </button>
 *       ))}
 *       
 *       {selectedVariation && (
 *         <p>Price: {selectedVariation.price}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
