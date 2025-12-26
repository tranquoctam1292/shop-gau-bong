'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import type { SkuValidationResult } from '@/lib/hooks/useSkuValidation';

/**
 * Basic Info Section Component
 * 
 * PHASE 2: Extract Form Sections - BasicInfoSection
 * 
 * Displays product name and SKU with validation
 * Barcode/GTIN/EAN fields are hidden (not used)
 * Uses Context API to access form state and handlers
 * 
 * @param skuValidation - SKU validation result from useSkuValidation hook
 */
interface BasicInfoSectionProps {
  skuValidation: SkuValidationResult;
}

const BasicInfoSectionComponent = function BasicInfoSection({
  skuValidation,
}: BasicInfoSectionProps) {
  const {
    register,
    watch,
    errors,
    getFieldClassName,
    savedFields,
    handleFieldFocus,
    handleFieldBlur,
  } = useQuickEditFormContext();

  const name = watch('name');
  const sku = watch('sku');
  // HIDDEN: Barcode/GTIN/EAN fields are not used
  // const barcode = watch('barcode');
  // const gtin = watch('gtin');
  // const ean = watch('ean');

  return (
    <>
      {/* UX/UI UPGRADE Phase 1.1.1: Background colors cho sections */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding and spacing on mobile */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4 mb-4 md:mb-6">
        {/* Row 1: Thông tin cơ bản - Grid 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="space-y-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-name" className="text-slate-900">Tên sản phẩm</Label>
            </div>
            {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
            <Input
              id="quick-edit-name"
              {...register('name')}
              onFocus={(e) => handleFieldFocus('quick-edit-name', e)}
              onBlur={handleFieldBlur}
              className={getFieldClassName('name', name, !!errors.name, savedFields.has('name'), 'quick-edit-name')}
              aria-label="Tên sản phẩm"
              aria-describedby={errors.name ? 'quick-edit-name-error' : 'quick-edit-name-help'}
            />
            {errors.name && (
              <p id="quick-edit-name-error" className="text-xs text-red-500" role="alert">{errors.name.message}</p>
            )}
            <p id="quick-edit-name-help" className="sr-only">Nhập tên sản phẩm</p>
          </div>

          {/* SKU */}
          <div className="space-y-2">
            {/* UX/UI UPGRADE Phase 3.3.2: Minimum 8px spacing giữa touch targets */}
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="flex items-center gap-2 min-h-[21px]">
              <Label htmlFor="quick-edit-sku" className="text-slate-900 flex-1">SKU</Label>
              {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
              <button
                type="button"
                title="Mã sản phẩm duy nhất (Stock Keeping Unit). VD: GAU-BONG-001"
                className="h-5 w-5 flex items-center justify-center cursor-help flex-shrink-0"
                aria-label="Thông tin về SKU"
              >
                <Info className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="relative">
              <Input
                id="quick-edit-sku"
                {...register('sku')}
                onFocus={(e) => handleFieldFocus('quick-edit-sku', e)}
                onBlur={handleFieldBlur}
                aria-label="Mã SKU sản phẩm"
                aria-describedby={errors.sku ? 'quick-edit-sku-error' : skuValidation.error ? 'quick-edit-sku-validation-error' : 'quick-edit-sku-help'}
                className={`${getFieldClassName('sku', sku, !!(errors.sku || (skuValidation.isValid === false && skuValidation.error)), savedFields.has('sku'), 'quick-edit-sku', skuValidation.isValid === true && !errors.sku ? true : undefined)} pr-10`}
                placeholder="VD: GAU-BONG-001"
              />
              {/* PHASE 2: SKU Real-time Validation (7.8.2) - Visual feedback icons */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {skuValidation.isValidating && (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                )}
                {!skuValidation.isValidating && skuValidation.isValid === true && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {!skuValidation.isValidating && skuValidation.isValid === false && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {/* PHASE 2: SKU Real-time Validation (7.8.2) - Error messages */}
            {/* PHASE 3: ARIA Labels & Accessibility (7.9.1) - Link error messages with aria-describedby */}
            {errors.sku && (
              <div id="quick-edit-sku-error" className="flex items-center gap-1 text-sm text-red-600" role="alert">
                <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <p>{errors.sku.message}</p>
              </div>
            )}
            {!errors.sku && skuValidation.error && (
              <div id="quick-edit-sku-validation-error" className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{skuValidation.error}</p>
              </div>
            )}
            {!errors.sku && !skuValidation.error && skuValidation.isValid === true && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <p>SKU có sẵn</p>
              </div>
            )}
            <p id="quick-edit-sku-help" className="text-xs text-slate-500">Mã sản phẩm duy nhất để quản lý tồn kho</p>
          </div>
        </div>

        {/* HIDDEN: PHASE 3: Barcode/GTIN/EAN (4.3.1) - Not used, hidden from UI */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="quick-edit-barcode" className="text-slate-900">Barcode</Label>
            <Input
              id="quick-edit-barcode"
              {...register('barcode')}
              className={getFieldClassName('barcode', barcode, !!errors.barcode, savedFields.has('barcode'), 'quick-edit-barcode')}
              placeholder="Nhập barcode..."
              onFocus={(e) => handleFieldFocus('quick-edit-barcode', e)}
              onBlur={handleFieldBlur}
              aria-label="Barcode sản phẩm"
              aria-describedby={errors.barcode ? 'quick-edit-barcode-error' : 'quick-edit-barcode-help'}
            />
            {errors.barcode && (
              <p id="quick-edit-barcode-error" className="text-xs text-red-500" role="alert">{errors.barcode.message}</p>
            )}
            <p id="quick-edit-barcode-help" className="sr-only">Nhập mã barcode của sản phẩm</p>
          </div>
          
          <div className="space-y-2">
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-gtin" className="text-slate-900">GTIN</Label>
            </div>
            <Input
              id="quick-edit-gtin"
              {...register('gtin')}
              className={getFieldClassName('gtin', gtin, !!errors.gtin, savedFields.has('gtin'), 'quick-edit-gtin')}
              placeholder="Nhập GTIN..."
              onFocus={(e) => handleFieldFocus('quick-edit-gtin', e)}
              onBlur={handleFieldBlur}
              aria-label="GTIN (Global Trade Item Number)"
              aria-describedby={errors.gtin ? 'quick-edit-gtin-error' : 'quick-edit-gtin-help'}
            />
            {errors.gtin && (
              <p id="quick-edit-gtin-error" className="text-xs text-red-500" role="alert">{errors.gtin.message}</p>
            )}
            <p id="quick-edit-gtin-help" className="text-xs text-slate-500">Global Trade Item Number</p>
          </div>
          
          <div className="space-y-2">
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-ean" className="text-slate-900">EAN</Label>
            </div>
            <Input
              id="quick-edit-ean"
              {...register('ean')}
              className={getFieldClassName('ean', ean, !!errors.ean, savedFields.has('ean'), 'quick-edit-ean')}
              placeholder="Nhập EAN..."
              onFocus={(e) => handleFieldFocus('quick-edit-ean', e)}
              onBlur={handleFieldBlur}
              aria-label="EAN (European Article Number)"
              aria-describedby={errors.ean ? 'quick-edit-ean-error' : 'quick-edit-ean-help'}
            />
            {errors.ean && (
              <p id="quick-edit-ean-error" className="text-xs text-red-500" role="alert">{errors.ean.message}</p>
            )}
            <p id="quick-edit-ean-help" className="text-xs text-slate-500">European Article Number</p>
          </div>
        </div> */}
      </div>
    </>
  );
};

BasicInfoSectionComponent.displayName = 'BasicInfoSection';

export const BasicInfoSection = memo(BasicInfoSectionComponent);
