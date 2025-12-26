'use client';

import { memo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Info, Box } from 'lucide-react';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import type { UseFormSetValue } from 'react-hook-form';
import type { QuickEditFormData } from '../types';

/**
 * Auto-sync stock status logic
 * Pure function that can be extracted
 */
const handleStockQuantityChange = (
  newQty: number,
  currentStatus: string,
  setValue: UseFormSetValue<QuickEditFormData>
) => {
  // Only auto-sync if current status is NOT onbackorder
  if (currentStatus !== 'onbackorder') {
    if (newQty > 0) {
      setValue('stockStatus', 'instock', { shouldDirty: true });
    } else {
      setValue('stockStatus', 'outofstock', { shouldDirty: true });
    }
  }
  // If onbackorder, respect user's manual choice (don't auto-sync)
};

/**
 * Inventory Section Component
 * 
 * PHASE 2: Extract Form Sections - InventorySection
 * 
 * Displays inventory management fields: manage stock, stock quantity, stock status,
 * low stock threshold, backorders, and sold individually
 * Uses Context API to access form state and handlers
 * 
 * @param loadedSections - Set of loaded sections for progressive loading
 */
interface InventorySectionProps {
  loadedSections: Set<string>;
}

export const InventorySection = memo(function InventorySection({
  loadedSections,
}: InventorySectionProps) {
  const {
    register,
    watch,
    setValue,
    errors,
    getFieldClassName,
    savedFields,
    handleFieldFocus,
    handleFieldBlur,
  } = useQuickEditFormContext();

  const manageStock = watch('manageStock');
  const stockQuantity = watch('stockQuantity');
  const currentStockStatus = watch('stockStatus');
  const lowStockThreshold = watch('lowStockThreshold');
  const backorders = watch('backorders');
  const soldIndividually = watch('soldIndividually');

  // Handle stock quantity change with auto-sync
  const handleStockQtyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseInt(e.target.value, 10) || 0;
    setValue('stockQuantity', newQty, { shouldDirty: true });
    handleStockQuantityChange(newQty, currentStockStatus, setValue);
    
    // PHASE 3: Backorders Auto-sync (4.3.4) - Nếu "Do not allow" và stock = 0 → stockStatus = "outofstock"
    const currentBackorders = watch('backorders') || 'no';
    if (currentBackorders === 'no' && newQty === 0) {
      setValue('stockStatus', 'outofstock', { shouldDirty: true });
    }
  }, [setValue, currentStockStatus, watch]);

  return (
    <>
      {/* PHASE 5.3.2: Accordion Layout - Inventory section (part of Pricing tab) */}
      {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Critical section - Always show inventory */}
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Box className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Tồn kho</h3>
      </div>

      {/* Inventory Card */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding and spacing on mobile */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4 mb-4 md:mb-6">
        {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
        <div className="flex items-center space-x-2 min-h-[44px]">
          <Checkbox
            id="quick-edit-manage-stock"
            checked={manageStock || false}
            onCheckedChange={(checked) => {
              setValue('manageStock', checked === true, { shouldDirty: true });
            }}
          />
          <Label 
            htmlFor="quick-edit-manage-stock" 
            className="text-sm font-medium text-slate-900 cursor-pointer"
          >
            Quản lý tồn kho
          </Label>
        </div>

        {manageStock && (
          <>
            {/* PHASE 5.3.4: Reorganize Inventory Section - Stock Quantity + Stock Status (2 cột) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                {/* UX/UI UPGRADE Phase 3.3.2: Minimum 8px spacing giữa touch targets */}
                {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
                <div className="flex items-center gap-2 min-h-[21px]">
                  <Label htmlFor="quick-edit-stock-quantity" className="text-slate-900 flex-1">Số lượng tồn kho</Label>
                  {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
                  <button
                    type="button"
                    title="Số lượng sản phẩm hiện có trong kho. VD: 100"
                    className="h-5 w-5 flex items-center justify-center cursor-help flex-shrink-0"
                    aria-label="Thông tin về số lượng tồn kho"
                  >
                    <Info className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
                {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
                <Input
                  id="quick-edit-stock-quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={stockQuantity}
                  onChange={handleStockQtyChange}
                  onFocus={(e) => handleFieldFocus('quick-edit-stock-quantity', e)}
                  onBlur={handleFieldBlur}
                  className={getFieldClassName('stockQuantity', stockQuantity, !!errors.stockQuantity, savedFields.has('stockQuantity'), 'quick-edit-stock-quantity')}
                  placeholder="Nhập số lượng tồn kho..."
                  aria-label="Số lượng tồn kho"
                  aria-describedby={errors.stockQuantity ? 'quick-edit-stock-quantity-error' : 'quick-edit-stock-quantity-help'}
                />
                {errors.stockQuantity && (
                  <p id="quick-edit-stock-quantity-error" className="text-xs text-red-500" role="alert">{errors.stockQuantity.message}</p>
                )}
                <p id="quick-edit-stock-quantity-help" className="text-xs text-slate-500">Số lượng sản phẩm hiện có trong kho</p>
              </div>

              <div className="space-y-2">
                {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
                <div className="min-h-[21px]">
                  <Label htmlFor="quick-edit-stock-status" className="text-slate-900">Trạng thái kho</Label>
                </div>
                {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
                <Select
                  value={currentStockStatus}
                  onValueChange={(value) => {
                    setValue('stockStatus', value as 'instock' | 'outofstock' | 'onbackorder', { shouldDirty: true });
                  }}
                >
                  <SelectTrigger 
                    id="quick-edit-stock-status"
                    className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                    aria-label="Trạng thái kho hàng"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instock">Còn hàng</SelectItem>
                    <SelectItem value="outofstock">Hết hàng</SelectItem>
                    <SelectItem value="onbackorder">Đặt hàng trước</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Trạng thái hiện tại của kho hàng</p>
              </div>
            </div>

            {/* PHASE 5.3.4: Reorganize Inventory Section - Low Stock Threshold (full width) */}
            {loadedSections.has('secondary') && (
              <div className="space-y-2">
                {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
                <div className="min-h-[21px]">
                  <Label htmlFor="quick-edit-low-stock-threshold" className="text-slate-900">
                    Ngưỡng tồn kho thấp
                  </Label>
                </div>
                {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
                <Input
                  id="quick-edit-low-stock-threshold"
                  type="number"
                  min="0"
                  step="1"
                  {...register('lowStockThreshold', { 
                    valueAsNumber: true,
                    setValueAs: (v) => {
                      if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                      return typeof v === 'number' ? Math.floor(v) : parseInt(v, 10);
                    }
                  })}
                  className={`${getFieldClassName('lowStockThreshold', lowStockThreshold, !!errors.lowStockThreshold, savedFields.has('lowStockThreshold'), 'quick-edit-low-stock-threshold')} max-w-xs`}
                  placeholder="Nhập ngưỡng tồn kho thấp..."
                  aria-label="Ngưỡng tồn kho thấp"
                  aria-describedby={errors.lowStockThreshold ? 'quick-edit-low-stock-threshold-error' : 'quick-edit-low-stock-threshold-help'}
                />
                {errors.lowStockThreshold && (
                  <p id="quick-edit-low-stock-threshold-error" className="text-xs text-red-500" role="alert">{errors.lowStockThreshold.message}</p>
                )}
                <p id="quick-edit-low-stock-threshold-help" className="text-xs text-slate-500">
                  Cảnh báo khi số lượng tồn kho &lt;= giá trị này
                </p>
              </div>
            )}

            {/* PHASE 5.3.4: Reorganize Inventory Section - Backorders (full width) */}
            <div className="space-y-2">
              {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
              <div className="min-h-[21px]">
                <Label htmlFor="quick-edit-backorders" className="text-slate-900">
                  Cho phép đặt hàng trước (Backorders)
                </Label>
              </div>
              {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
              <Select
                value={backorders || 'no'}
                onValueChange={(value) => {
                  setValue('backorders', value as 'no' | 'notify' | 'yes', { shouldDirty: true });
                  const currentStockQty = watch('stockQuantity') || 0;
                  if (value === 'no' && currentStockQty === 0) {
                    setValue('stockStatus', 'outofstock', { shouldDirty: true });
                  }
                }}
              >
                <SelectTrigger 
                  id="quick-edit-backorders"
                  className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                  aria-label="Cho phép đặt hàng trước (Backorders)"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Không cho phép</SelectItem>
                  <SelectItem value="notify">Cho phép nhưng thông báo khách</SelectItem>
                  <SelectItem value="yes">Cho phép</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Cho phép khách hàng đặt hàng khi sản phẩm hết hàng
              </p>
              {backorders === 'no' && (watch('stockQuantity') || 0) === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Trạng thái kho đã được tự động đặt thành &quot;Hết hàng&quot;
                </p>
              )}
            </div>
          </>
        )}
        
        {/* PHASE 3: Sold Individually (4.3.3) - Not part of core inventory, but kept in section for now */}
        {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quick-edit-sold-individually"
              checked={soldIndividually || false}
              onCheckedChange={(checked) => {
                setValue('soldIndividually', checked === true, { shouldDirty: true });
              }}
            />
            <Label 
              htmlFor="quick-edit-sold-individually" 
              className="text-sm font-medium text-slate-900 cursor-pointer"
            >
              Chỉ bán từng cái (Sold Individually)
            </Label>
          </div>
          <p className="text-xs text-slate-500 ml-6">
            Khi bật, khách hàng chỉ có thể mua 1 sản phẩm mỗi đơn hàng
          </p>
        </div>
      </div>
    </>
  );
});

InventorySection.displayName = 'InventorySection';

