'use client';

import { memo, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { VariantQuickEditTable } from '../../VariantQuickEditTable';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import type { ProductWithVariants } from '@/lib/hooks/useProduct';

/**
 * Variants Section Component
 * 
 * PHASE 2: Extract Form Sections - VariantsSection
 * 
 * Displays variant table for variable products
 * Uses Context API to access form state and handlers
 * 
 * @param productWithVariants - Product data with variants from API
 * @param loadingProduct - Loading state from useProduct hook
 * @param loadedSections - Set of loaded sections for progressive loading
 */
interface VariantsSectionProps {
  productWithVariants: ProductWithVariants | null;
  loadingProduct: boolean;
  loadedSections: Set<string>;
}

export const VariantsSection = memo(function VariantsSection({
  productWithVariants,
  loadingProduct,
  loadedSections,
}: VariantsSectionProps) {
  const {
    watch,
    setValue,
  } = useQuickEditFormContext();

  const formData = watch();
  const variants = formData.variants;

  // CRITICAL FIX: Always use formData.variants as source of truth (user edits)
  // Only fallback to productWithVariants on initial load
  // This ensures UI updates immediately when user edits variants
  const currentVariants = useMemo(() => {
    return variants && variants.length > 0 
      ? variants 
      : (productWithVariants?.variants || []);
  }, [variants, productWithVariants?.variants]);

  const hasVariants = currentVariants.length > 0;

  // Map variants ensuring all fields are present (including color and colorCode for display)
  const mappedVariants = useMemo(() => {
    if (!hasVariants) return [];
    
    return currentVariants.map((v: any) => {
      const mapped = {
        id: v.id || '',
        size: v.size || '',
        // Preserve color and colorCode (even if empty string, convert to undefined to match schema)
        color: (v.color && v.color.trim()) ? v.color.trim() : undefined,
        colorCode: (v.colorCode && v.colorCode.trim()) ? v.colorCode.trim() : undefined,
        price: v.price || 0,
        stock: v.stock || v.stockQuantity || 0,
        image: v.image || undefined,
        sku: v.sku || '',
      };
      
      return mapped;
    });
  }, [currentVariants, hasVariants]);

  // Only show if section is loaded or has variants
  if (!loadedSections.has('secondary') && !(variants && variants.length > 0)) {
    return null;
  }

  if (!hasVariants) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Variant Table Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-base font-semibold text-slate-900">Biến thể ({mappedVariants.length})</Label>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            Sửa trực tiếp trên bảng
          </span>
        </div>
      </div>
      <VariantQuickEditTable
        variants={mappedVariants}
        isLoading={loadingProduct}
        onVariantsChange={(updatedVariants) => {
          // Fix #20: Get original variants from productWithVariants OR current mappedVariants (fallback for race condition)
          // This ensures we preserve size, color, colorCode, image even if productWithVariants hasn't loaded yet
          const originalVariants = productWithVariants?.variants || mappedVariants || [];
          
          // Update form state with edited values, preserving display fields from original
          setValue('variants', updatedVariants.map((v) => {
            // Find original variant to preserve display-only fields (with fallback to mappedVariants)
            const originalVariant = originalVariants.find((orig: any) => orig.id === v.id) ||
                                   mappedVariants.find((mapped: any) => mapped.id === v.id);
            return {
              id: v.id,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              // Preserve display fields from original variant (with fallback chain)
              size: originalVariant?.size || v.size || '',
              color: originalVariant?.color || v.color || undefined,
              colorCode: originalVariant?.colorCode || v.colorCode || undefined,
              image: originalVariant?.image || v.image || undefined,
            };
          }), { shouldDirty: true, shouldValidate: false });
        }}
        bulkUpdate={formData.bulkUpdate}
        onBulkUpdateChange={(enabled) => {
          setValue('bulkUpdate', enabled, { shouldDirty: true });
        }}
      />
    </div>
  );
});

VariantsSection.displayName = 'VariantsSection';

