'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler } from 'lucide-react';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';

/**
 * Dimensions Section Component
 * 
 * PHASE 2: Extract Form Sections - DimensionsSection
 * 
 * Displays weight, length, width, height fields with volumetric weight calculation
 * Uses Context API to access form state and handlers
 */
export const DimensionsSection = memo(function DimensionsSection() {
  const {
    register,
    watch,
    errors,
    getFieldClassName,
    savedFields,
  } = useQuickEditFormContext();

  // Watch dimension values for volumetric weight calculation
  const weight = watch('weight');
  const length = watch('length');
  const width = watch('width');
  const height = watch('height');

  return (
    <>
      {/* PHASE 5.3.2: Accordion Layout - Dimensions section (part of Shipping) */}
      {/* PHASE 1: Weight & Dimensions Section (4.1.3) */}
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      {/* UX/UI UPGRADE Phase 4.2.1: Make section headers focusable for keyboard navigation */}
      <div 
        id="section-dimensions" 
        className="mb-6 scroll-mt-4"
        tabIndex={-1}
        role="region"
        aria-label="Kích thước & Trọng lượng"
      >
        {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
        <div className="flex items-center gap-2 mb-2 mt-6">
          <Ruler className="h-5 w-5 text-slate-600" aria-hidden="true" />
          <h3 className="text-base font-semibold text-slate-900">Kích thước & Trọng lượng</h3>
        </div>
        {/* UX/UI UPGRADE Phase 1.1.2: Section spacing và borders */}
        {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
        <div className="bg-slate-50 border border-slate-200 border-t-slate-300 rounded-md p-3 md:p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Weight Field */}
            <div className="space-y-2">
              {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
              <div className="min-h-[21px]">
                <Label htmlFor="quick-edit-weight" className="text-slate-900">Trọng lượng (kg)</Label>
              </div>
              {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
              <Input
                id="quick-edit-weight"
                type="number"
                step="0.1"
                min="0"
                {...register('weight', { 
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                    return typeof v === 'number' ? v : parseFloat(v);
                  }
                })}
                className={getFieldClassName('weight', weight, !!errors.weight, savedFields.has('weight'), 'quick-edit-weight')}
                aria-label="Trọng lượng sản phẩm (kg)"
                aria-describedby={errors.weight ? 'quick-edit-weight-error' : 'quick-edit-weight-help'}
              />
              {errors.weight && (
                <p id="quick-edit-weight-error" className="text-xs text-red-500" role="alert">{errors.weight.message}</p>
              )}
              <p id="quick-edit-weight-help" className="sr-only">Nhập trọng lượng sản phẩm tính bằng kilogram</p>
            </div>

            {/* Length Field */}
            <div className="space-y-2">
              {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
              <div className="min-h-[21px]">
                <Label htmlFor="quick-edit-length" className="text-slate-900">Chiều dài (cm)</Label>
              </div>
              {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
              <Input
                id="quick-edit-length"
                type="number"
                step="0.1"
                min="0"
                {...register('length', { 
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                    return typeof v === 'number' ? v : parseFloat(v);
                  }
                })}
                className={getFieldClassName('length', length, !!errors.length, savedFields.has('length'), 'quick-edit-length')}
                aria-label="Chiều dài sản phẩm (cm)"
                aria-describedby={errors.length ? 'quick-edit-length-error' : 'quick-edit-length-help'}
              />
              {errors.length && (
                <p id="quick-edit-length-error" className="text-xs text-red-500" role="alert">{errors.length.message}</p>
              )}
              <p id="quick-edit-length-help" className="sr-only">Nhập chiều dài sản phẩm tính bằng centimet</p>
            </div>

            {/* Width Field */}
            <div className="space-y-2">
              {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
              <div className="min-h-[21px]">
                <Label htmlFor="quick-edit-width" className="text-slate-900">Chiều rộng (cm)</Label>
              </div>
              {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
              <Input
                id="quick-edit-width"
                type="number"
                step="0.1"
                min="0"
                {...register('width', { 
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                    return typeof v === 'number' ? v : parseFloat(v);
                  }
                })}
                className={getFieldClassName('width', width, !!errors.width, savedFields.has('width'), 'quick-edit-width')}
                aria-label="Chiều rộng sản phẩm (cm)"
                aria-describedby={errors.width ? 'quick-edit-width-error' : 'quick-edit-width-help'}
              />
              {errors.width && (
                <p id="quick-edit-width-error" className="text-xs text-red-500" role="alert">{errors.width.message}</p>
              )}
              <p id="quick-edit-width-help" className="sr-only">Nhập chiều rộng sản phẩm tính bằng centimet</p>
            </div>

            {/* Height Field */}
            <div className="space-y-2">
              {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
              <div className="min-h-[21px]">
                <Label htmlFor="quick-edit-height" className="text-slate-900">Chiều cao (cm)</Label>
              </div>
              {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
              <Input
                id="quick-edit-height"
                type="number"
                step="0.1"
                min="0"
                {...register('height', { 
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                    return typeof v === 'number' ? v : parseFloat(v);
                  }
                })}
                className={getFieldClassName('height', height, !!errors.height, savedFields.has('height'), 'quick-edit-height')}
                aria-label="Chiều cao sản phẩm (cm)"
                aria-describedby={errors.height ? 'quick-edit-height-error' : 'quick-edit-height-help'}
              />
              {errors.height && (
                <p id="quick-edit-height-error" className="text-xs text-red-500" role="alert">{errors.height.message}</p>
              )}
              <p id="quick-edit-height-help" className="sr-only">Nhập chiều cao sản phẩm tính bằng centimet</p>
              {/* Display calculated volumetric weight */}
              {(() => {
                if (length && width && height && length > 0 && width > 0 && height > 0) {
                  const volumetricWeight = (length * width * height) / 6000;
                  return (
                    <p className="text-xs text-slate-500">
                      Trọng lượng thể tích: {volumetricWeight.toFixed(2)} kg
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

DimensionsSection.displayName = 'DimensionsSection';

