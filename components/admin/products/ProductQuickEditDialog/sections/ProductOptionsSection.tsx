'use client';

import { memo, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tag, AlertCircle } from 'lucide-react';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import type { MappedProduct } from '@/lib/utils/productMapper';
import type { ProductWithVariants } from '@/lib/hooks/useProduct';

/**
 * Product Options Section Component
 * 
 * PHASE 2.5: Extract Form Sections - ProductOptionsSection
 * 
 * Displays product attributes enable/disable options for variable products
 * Uses Context API to access form state and handlers
 * 
 * @param product - Product data (MappedProduct)
 * @param productWithVariants - Product with variants data
 */
interface ProductOptionsSectionProps {
  product: MappedProduct | null | undefined;
  productWithVariants: ProductWithVariants | null;
}

export const ProductOptionsSection = memo(function ProductOptionsSection({
  product,
  productWithVariants,
}: ProductOptionsSectionProps) {
  const {
    watch,
    setValue,
    getFieldClassName,
  } = useQuickEditFormContext();

  const productType = watch('productType');
  const formData = watch();
  const isVariableProduct = productType === 'variable' || product?.type === 'variable';
  
  // Get product attributes
  const productAttributes = useMemo(() => {
    return (productWithVariants as any)?.productDataMetaBox?.attributes || 
           (product as any)?.productDataMetaBox?.attributes || [];
  }, [product, productWithVariants]);
  
  const hasAttributes = productAttributes.length > 0;
  
  // Get variants
  const variants = useMemo(() => {
    return formData.variants && formData.variants.length > 0 
      ? formData.variants 
      : (productWithVariants?.variants || []);
  }, [formData.variants, productWithVariants?.variants]);
  
  // Only show for variable products with attributes
  if (!isVariableProduct || !hasAttributes) {
    return null;
  }
  
  return (
    <div className="space-y-4 mb-6">
      {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Tag className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Tùy chọn sản phẩm</h3>
      </div>
      
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-3">
        <p className="text-sm text-slate-600 mb-3">
          Bật/tắt các thuộc tính (Size, Color, etc.) cho sản phẩm
        </p>
        
        {productAttributes.map((attr: any, index: number) => {
          const attrName = attr.name || '';
          const isVisible = attr.visible !== false; // Default to true if not set
          const isVariation = attr.variation === true;
          
          // Check if attribute has active variants
          const hasActiveVariants = isVariation && variants.length > 0 && variants.some((variant: any) => {
            const attrNameLower = attrName.toLowerCase();
            if (attrNameLower === 'size' && variant.size) return true;
            if (attrNameLower === 'color' && variant.color) return true;
            return false;
          });
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={(checked) => {
                    // Warning if disabling attribute with active variants
                    if (!checked && hasActiveVariants) {
                      const confirmMsg = `Thuộc tính "${attrName}" đang được sử dụng bởi ${variants.length} biến thể. Bạn có chắc muốn tắt không?`;
                      if (!window.confirm(confirmMsg)) {
                        return; // Don't update if user cancels
                      }
                    }
                    
                    // Update attributes array
                    const currentAttributes = productAttributes.map((a: any, idx: number) => {
                      if (idx === index) {
                        return { ...a, visible: checked };
                      }
                      return a;
                    });
                    
                    // Set form value
                    const attributesToUpdate = currentAttributes.map((a: any) => ({
                      name: a.name,
                      visible: a.visible !== false,
                    }));
                    
                    setValue('attributes', attributesToUpdate, { shouldDirty: true });
                  }}
                  id={`attribute-${index}`}
                />
                <Label 
                  htmlFor={`attribute-${index}`} 
                  className="text-sm font-medium text-slate-900 cursor-pointer"
                >
                  {attrName}
                  {isVariation && (
                    <span className="ml-2 text-xs text-slate-500">(Dùng cho biến thể)</span>
                  )}
                </Label>
              </div>
              
              {hasActiveVariants && !isVisible && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Có biến thể đang sử dụng
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ProductOptionsSection.displayName = 'ProductOptionsSection';

