'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';
import { VariationTable } from './VariationTable';
import { VariationsBulkEditToolbar } from './VariationsBulkEditToolbar';
import { VariationImageMapper } from './VariationImageMapper';
import { VariantSkuGenerator } from '@/components/admin/products/VariantSkuGenerator';
import { validateVariantUniqueness } from '@/lib/utils/skuValidator';
import { useToastContext } from '@/components/providers/ToastProvider';
import type { Variation } from './VariationTable';

interface VariationsTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
  productName?: string; // For SKU auto-generation
  categoryId?: string; // For SKU auto-generation
}

/**
 * Variations Tab - Product Variations
 * Features:
 * - Generate Variations button với Cartesian Product algorithm
 * - Variations Table View với inline editing
 * - Variation Image Upload
 * - Performance optimization
 */
export function VariationsTab({ state, onUpdate, productName, categoryId }: VariationsTabProps) {
  const { showToast } = useToastContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoGenerateSku, setAutoGenerateSku] = useState(false);
  const [previewSkus, setPreviewSkus] = useState<Record<string, string>>({});
  const [hasIncrementToken, setHasIncrementToken] = useState(false);
  const [variantValidationErrors, setVariantValidationErrors] = useState<string[]>([]);

  // Get attributes that are used for variations
  const variationAttributes = useMemo(() => {
    return state.attributes.filter((attr) => attr.usedForVariations && attr.values.length > 0);
  }, [state.attributes]);

  // Check if we can generate variations
  const canGenerateVariations = variationAttributes.length > 0;

  // ✅ PERFORMANCE: Maximum variations limit to prevent browser freeze
  const MAX_VARIATIONS = 100; // Maximum allowed variations to prevent browser freeze
  
  // Calculate total possible variations (Cartesian product)
  const totalPossibleVariations = useMemo(() => {
    if (variationAttributes.length === 0) return 0;
    return variationAttributes.reduce((total, attr) => total * attr.values.length, 1);
  }, [variationAttributes]);
  
  // Check if variations exceed limit
  const exceedsLimit = totalPossibleVariations > MAX_VARIATIONS;

  /**
   * Generate all possible variations using Cartesian Product
   * Example: Color [Red, Blue] x Size [S, M] = 4 variations
   * 
   * ✅ PERFORMANCE: Limited to MAX_VARIATIONS to prevent browser freeze
   */
  const generateVariations = () => {
    if (!canGenerateVariations) return;

    // ✅ PERFORMANCE: Prevent generation if exceeds limit
    if (exceedsLimit) {
      showToast(
        `Không thể tạo ${totalPossibleVariations} biến thể. Giới hạn tối đa là ${MAX_VARIATIONS} biến thể để đảm bảo hiệu suất. Vui lòng giảm số lượng giá trị thuộc tính.`,
        'error'
      );
      return;
    }

    // Confirmation if there are existing variations
    if (state.variations.length > 0) {
      const confirmed = window.confirm(
        `Bạn đã có ${state.variations.length} biến thể. Tạo mới sẽ xóa tất cả biến thể hiện tại. Bạn có muốn tiếp tục?`
      );
      if (!confirmed) return;
    }

    setIsGenerating(true);

    try {
      // Cartesian Product algorithm
      const generateCombinations = (attributes: typeof variationAttributes): Array<Record<string, string>> => {
        if (attributes.length === 0) return [{}];
        if (attributes.length === 1) {
          return attributes[0].values.map((value) => ({
            [attributes[0].name]: value,
          }));
        }

        // Recursive: combine first attribute with all combinations of the rest
        const first = attributes[0];
        const rest = attributes.slice(1);
        const restCombinations = generateCombinations(rest);

        const combinations: Array<Record<string, string>> = [];
        for (const value of first.values) {
          for (const restCombo of restCombinations) {
            combinations.push({
              [first.name]: value,
              ...restCombo,
            });
          }
        }
        return combinations;
      };

      const combinations = generateCombinations(variationAttributes);

      // Create variation objects
      const newVariations = combinations.map((attributes, index) => {
        // Generate variation name from attributes
        const nameParts = Object.entries(attributes)
          .map(([attrName, value]) => `${attrName}: ${value}`)
          .join(', ');
        const name = nameParts || `Variation ${index + 1}`;

        // Only copy prices if they exist
        const variationData: any = {
          id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
          name,
          sku: '',
          image: undefined,
          attributes,
        };
        
        // Only include prices if they are defined
        if (state.costPrice !== undefined) variationData.costPrice = state.costPrice;
        if (state.regularPrice !== undefined) variationData.regularPrice = state.regularPrice;
        if (state.salePrice !== undefined && state.regularPrice !== undefined && state.salePrice < state.regularPrice) {
          variationData.salePrice = state.salePrice;
        }
        if (state.stockQuantity !== undefined) variationData.stockQuantity = state.stockQuantity;
        
        return variationData;
      });

      // Validate variant uniqueness before updating
      const validation = validateVariantUniqueness(newVariations);
      if (!validation.isValid) {
        setVariantValidationErrors(validation.errors);
        showToast('Có biến thể trùng lặp. Vui lòng kiểm tra lại.', 'error');
        return;
      }
      
      setVariantValidationErrors([]);
      onUpdate({ variations: newVariations });
    } catch (error) {
      console.error('Error generating variations:', error);
      showToast('Có lỗi xảy ra khi tạo biến thể. Vui lòng thử lại.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Validate variants whenever they change
  useEffect(() => {
    if (state.variations.length === 0) {
      setVariantValidationErrors([]);
      return;
    }

    const validation = validateVariantUniqueness(
      state.variations.map((v) => ({
        attributes: v.attributes,
        size: v.attributes?.Size || v.attributes?.size,
        color: v.attributes?.Color || v.attributes?.color,
      }))
    );

    setVariantValidationErrors(validation.errors);
  }, [state.variations]);

  // Empty state
  if (!canGenerateVariations) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Biến thể</h3>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Chưa có thuộc tính để tạo biến thể
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Vui lòng thêm thuộc tính trong tab &quot;Thuộc tính&quot; và đánh dấu &quot;Dùng cho biến thể&quot; để có thể tạo biến thể.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Biến thể</h3>

        {/* Generate Variations Section */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium mb-1">Tạo biến thể tự động</p>
              <p className="text-xs text-muted-foreground">
                Sẽ tạo {totalPossibleVariations} biến thể từ {variationAttributes.length} thuộc tính
              </p>
            </div>
            <Button
              type="button"
              onClick={generateVariations}
              disabled={isGenerating || !canGenerateVariations || exceedsLimit}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Tạo biến thể
                </>
              )}
            </Button>
          </div>

          {/* Variation Attributes Info */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Thuộc tính được sử dụng:</p>
            <div className="flex flex-wrap gap-2">
              {variationAttributes.map((attr) => (
                <div
                  key={attr.id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-background rounded border border-border text-xs"
                >
                  <span className="font-medium">{attr.name}:</span>
                  <span className="text-muted-foreground">{attr.values.length} giá trị</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variations Table */}
        {state.variations.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {state.variations.length} biến thể
              </p>
            </div>

            {/* Bulk Edit Toolbar */}
            <VariationsBulkEditToolbar
              variations={state.variations}
              attributes={variationAttributes}
              onBulkUpdate={(updates, filter) => {
                const updatedVariations = state.variations.map((variation) => {
                  // Check if variation matches filter
                  if (filter.applyToAll) {
                    return { ...variation, ...updates };
                  }
                  if (filter.attributeName && filter.attributeValue) {
                    if (variation.attributes[filter.attributeName] === filter.attributeValue) {
                      return { ...variation, ...updates };
                    }
                  }
                  return variation;
                });
                onUpdate({ variations: updatedVariations });
              }}
              onVariationsChange={(variations) => {
                onUpdate({ variations });
              }}
            />

            {/* Image Mapper */}
            <VariationImageMapper
              variations={state.variations}
              attributes={variationAttributes}
              onMapImages={(mappings) => {
                const updatedVariations = state.variations.map((variation) => {
                  // Find matching mapping
                  const mapping = mappings.find(
                    (m) =>
                      variation.attributes[m.attributeName] === m.attributeValue
                  );
                  if (mapping) {
                    return {
                      ...variation,
                      image: mapping.imageUrl,
                    };
                  }
                  return variation;
                });
                onUpdate({ variations: updatedVariations });
              }}
            />

            {/* Variant Validation Errors */}
            {variantValidationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Có biến thể trùng lặp
                    </p>
                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                      {variantValidationErrors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Không thể tạo 2 biến thể có cùng thuộc tính (Size, Màu, ...)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Variant SKU Generator */}
            {productName && (
              <VariantSkuGenerator
                variations={state.variations}
                productName={productName}
                categoryId={categoryId}
                onVariationsChange={(variations) => {
                  // Validate before updating
                  const validation = validateVariantUniqueness(
                    variations.map((v) => ({
                      attributes: v.attributes,
                      size: v.attributes?.Size || v.attributes?.size,
                      color: v.attributes?.Color || v.attributes?.color,
                    }))
                  );
                  
                  if (!validation.isValid) {
                    setVariantValidationErrors(validation.errors);
                    showToast('Có biến thể trùng lặp. Vui lòng kiểm tra lại.', 'error');
                    return;
                  }
                  
                  setVariantValidationErrors([]);
                  onUpdate({ variations });
                }}
                autoGenerateEnabled={autoGenerateSku}
                onAutoGenerateChange={setAutoGenerateSku}
                onPreviewSkusChange={setPreviewSkus}
                onHasIncrementTokenChange={setHasIncrementToken}
              />
            )}

            {/* Variations Table */}
            <VariationTable
              variations={state.variations}
              onVariationsChange={(variations) => {
                // Validate before updating
                const validation = validateVariantUniqueness(
                  variations.map((v) => ({
                    attributes: v.attributes,
                    size: v.attributes?.Size || v.attributes?.size,
                    color: v.attributes?.Color || v.attributes?.color,
                  }))
                );
                
                if (!validation.isValid) {
                  setVariantValidationErrors(validation.errors);
                  showToast('Có biến thể trùng lặp. Vui lòng kiểm tra lại.', 'error');
                  return;
                }
                
                setVariantValidationErrors([]);
                onUpdate({ variations });
              }}
              productName={productName}
              categoryId={categoryId}
              autoGenerateSku={autoGenerateSku}
              previewSkus={previewSkus}
              hasIncrementToken={hasIncrementToken}
            />
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">
              Chưa có biến thể nào. Nhấn &quot;Tạo biến thể&quot; để tạo tự động.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
