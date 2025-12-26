'use client';

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriceInput } from '../../PriceInput';
import { AlertCircle, Info } from 'lucide-react';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';

/**
 * Pricing Section Component
 * 
 * PHASE 2: Extract Form Sections - PricingSection
 * 
 * Displays status, regular price, sale price, and cost price fields with profit margin calculation
 * Uses Context API to access form state and handlers
 * 
 * @param showStatusChangeWarning - State to show status change warning dialog
 * @param setShowStatusChangeWarning - Setter for warning dialog
 * @param pendingStatus - Pending status when warning is shown
 * @param setPendingStatus - Setter for pending status
 * @param previousStatus - Previous status before change
 * @param setPreviousStatus - Setter for previous status
 */
interface PricingSectionProps {
  showStatusChangeWarning: boolean;
  setShowStatusChangeWarning: (show: boolean) => void;
  pendingStatus: 'draft' | 'publish' | 'trash' | null;
  setPendingStatus: (status: 'draft' | 'publish' | 'trash' | null) => void;
  previousStatus: 'draft' | 'publish' | 'trash' | null;
  setPreviousStatus: (status: 'draft' | 'publish' | 'trash' | null) => void;
}

export const PricingSection = memo(function PricingSection({
  showStatusChangeWarning,
  setShowStatusChangeWarning,
  pendingStatus,
  setPendingStatus,
  previousStatus,
  setPreviousStatus,
}: PricingSectionProps) {
  const {
    watch,
    setValue,
    errors,
    getFieldClassName,
    savedFields,
    handleFieldFocus,
    handleFieldBlur,
  } = useQuickEditFormContext();

  const status = watch('status');
  const regularPrice = watch('regularPrice');
  const salePrice = watch('salePrice');
  const costPrice = watch('costPrice');

  return (
    <>
      {/* UX/UI UPGRADE Phase 1.1.1: Background colors cho sections */}
      {/* UX/UI UPGRADE Phase 1.1.2: Section spacing và borders - border-top cho sections (trừ section đầu tiên) */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding and spacing on mobile */}
      <div className="bg-slate-50 border border-slate-200 border-t-slate-300 rounded-md p-3 md:p-4 space-y-4 mb-4 md:mb-6">
        {/* Row 2: Giá & Trạng thái - Grid 3 cột */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="quick-edit-status" className="text-slate-900">Trạng thái</Label>
            {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
            <Select
              value={status}
              onValueChange={(value) => {
                const newStatus = value as 'draft' | 'publish' | 'trash';
                const currentStatus = status;
                
                // PHASE 3: Status Change Confirmation (7.10.3) - Show warning when changing from Publish to Draft
                if (currentStatus === 'publish' && newStatus === 'draft') {
                  setPreviousStatus(currentStatus);
                  setPendingStatus(newStatus);
                  setShowStatusChangeWarning(true);
                } else {
                  setValue('status', newStatus, { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger 
                id="quick-edit-status"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                aria-label="Trạng thái sản phẩm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="publish">Đã xuất bản</SelectItem>
                <SelectItem value="trash">Thùng rác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Regular Price */}
          <div className="space-y-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-regular-price" className="text-slate-900">Giá gốc (đ)</Label>
            </div>
            <PriceInput
              id="quick-edit-regular-price"
              value={regularPrice}
              onChange={(value) => {
                setValue('regularPrice', value || 0, { shouldDirty: true });
              }}
              onFocus={(e) => handleFieldFocus('quick-edit-regular-price', e)}
              onBlur={handleFieldBlur}
              showCurrency={true}
              showClearButton={true}
              placeholder="Nhập giá gốc..."
              aria-label="Giá gốc sản phẩm"
              aria-describedby={errors.regularPrice ? 'quick-edit-regular-price-error' : 'quick-edit-regular-price-help'}
              className={getFieldClassName('regularPrice', regularPrice, !!errors.regularPrice, savedFields.has('regularPrice'), 'quick-edit-regular-price')}
            />
            {errors.regularPrice && (
              <p id="quick-edit-regular-price-error" className="text-xs text-red-500" role="alert">{errors.regularPrice.message}</p>
            )}
            {/* PHASE 2: Price Formatting Consistency (7.11.11) - Format hint */}
            <p id="quick-edit-regular-price-help" className="text-xs text-slate-500">VD: 1.000.000 đ</p>
          </div>

          {/* Sale Price */}
          <div className="space-y-2">
            {/* UX/UI UPGRADE Phase 3.3.2: Minimum 8px spacing giữa touch targets */}
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="flex items-center gap-2 min-h-[21px]">
              <Label htmlFor="quick-edit-sale-price" className="text-slate-900 flex-1">Giá khuyến mãi (đ)</Label>
              {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
              <button
                type="button"
                title="Giá khuyến mãi phải nhỏ hơn giá gốc. Để trống để xóa khuyến mãi. VD: 800000"
                className="h-5 w-5 flex items-center justify-center cursor-help flex-shrink-0"
                aria-label="Thông tin về giá khuyến mãi"
              >
                <Info className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <PriceInput
              id="quick-edit-sale-price"
              value={salePrice}
              onChange={(value) => {
                setValue('salePrice', value, { shouldDirty: true });
              }}
              onFocus={(e) => handleFieldFocus('quick-edit-sale-price', e)}
              onBlur={handleFieldBlur}
              showCurrency={true}
              showClearButton={true}
              placeholder="Nhập giá khuyến mãi..."
              aria-label="Giá khuyến mãi sản phẩm"
              aria-describedby={errors.salePrice ? 'quick-edit-sale-price-error' : 'quick-edit-sale-price-help'}
              className={getFieldClassName('salePrice', salePrice, !!errors.salePrice, savedFields.has('salePrice'), 'quick-edit-sale-price')}
            />
            {errors.salePrice && (
              <div id="quick-edit-sale-price-error" className="flex items-center gap-1 text-sm text-red-600" role="alert">
                <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <p>{errors.salePrice.message}</p>
              </div>
            )}
            {/* PHASE 2: Price Formatting Consistency (7.11.11) - Format hint */}
            <p id="quick-edit-sale-price-help" className="text-xs text-slate-500">Giá khuyến mãi (phải nhỏ hơn giá gốc). Để trống để xóa khuyến mãi. VD: 800.000 đ</p>
          </div>
        </div>

        {/* PHASE 2: Cost Price (4.2.2) */}
        <div className="space-y-2">
          {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
          <div className="min-h-[21px]">
            <Label htmlFor="quick-edit-cost-price" className="text-slate-900">Giá vốn (đ)</Label>
          </div>
          {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
          <PriceInput
            id="quick-edit-cost-price"
            value={costPrice}
            onChange={(value) => {
              setValue('costPrice', value, { shouldDirty: true });
            }}
            onFocus={(e) => handleFieldFocus('quick-edit-cost-price', e)}
            onBlur={handleFieldBlur}
            showCurrency={true}
            className={getFieldClassName('costPrice', costPrice, !!errors.costPrice, savedFields.has('costPrice'), 'quick-edit-cost-price')}
            aria-label="Giá vốn sản phẩm"
            aria-describedby={errors.costPrice ? 'quick-edit-cost-price-error' : 'quick-edit-cost-price-help'}
          />
          {errors.costPrice && (
            <p id="quick-edit-cost-price-error" className="text-xs text-red-500" role="alert">{errors.costPrice.message}</p>
          )}
          <p id="quick-edit-cost-price-help" className="sr-only">Giá vốn để tính lợi nhuận. VD: 500.000 đ</p>
          {/* PHASE 2: Price Formatting Consistency (7.11.11) - Format hint */}
          <p className="text-xs text-slate-500">VD: 500.000 đ</p>
          {/* Profit Margin Calculation */}
          {(() => {
            const currentCostPrice = watch('costPrice');
            const currentRegularPrice = watch('regularPrice');
            // PHASE 6: Fix profit margin calculation - Handle edge cases
            // Only calculate if both values exist and are valid numbers
            if (
              currentCostPrice !== undefined && 
              currentCostPrice !== null &&
              currentRegularPrice !== undefined && 
              currentRegularPrice !== null &&
              !isNaN(currentRegularPrice) &&
              !isNaN(currentCostPrice) &&
              currentRegularPrice > 0 && 
              currentCostPrice >= 0
            ) {
              const profit = currentRegularPrice - currentCostPrice;
              const profitMargin = currentRegularPrice > 0 
                ? ((profit / currentRegularPrice) * 100)
                : 0;
              return (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    Lợi nhuận: <span className={`font-medium ${profit >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                      {profit.toLocaleString('vi-VN')} đ
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Tỷ suất lợi nhuận: <span className={`font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(2)}%
                    </span>
                  </p>
                </div>
              );
            }
            return (
              <p className="text-xs text-slate-500">
                Giá vốn để tính lợi nhuận và tỷ suất lợi nhuận
              </p>
            );
          })()}
        </div>
      </div>
    </>
  );
});

PricingSection.displayName = 'PricingSection';

