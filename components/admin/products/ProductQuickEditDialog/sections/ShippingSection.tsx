'use client';

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';

/**
 * Shipping Section Component
 * 
 * PHASE 2: Extract Form Sections - ShippingSection
 * 
 * Displays shipping class, tax status, and tax class fields
 * Uses Context API to access form state and handlers
 */
export const ShippingSection = memo(function ShippingSection() {
  const {
    watch,
    setValue,
  } = useQuickEditFormContext();

  return (
    <>
      {/* PHASE 2: Shipping Class & Tax Settings Section (4.2.4) */}
      {/* UX/UI UPGRADE Phase 1.1.2: Section spacing và borders */}
      {/* PHASE 5.3.3: Optimize Grid Layout - Shipping & Tax */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding and spacing on mobile */}
      <div className="bg-slate-50 border border-slate-200 border-t-slate-300 rounded-md p-3 md:p-4 space-y-4 mb-4 md:mb-6">
        {/* Shipping Class - Full width */}
        <div className="space-y-2">
          {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
          <div className="min-h-[21px]">
            <Label htmlFor="quick-edit-shipping-class" className="text-slate-900">Lớp giao hàng</Label>
          </div>
          <Select
            value={watch('shippingClass') || '__none__'}
            onValueChange={(value) => {
              setValue('shippingClass', value === '__none__' ? undefined : value, { shouldDirty: true });
            }}
          >
            <SelectTrigger 
              id="quick-edit-shipping-class"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
              aria-label="Lớp giao hàng"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Không có</SelectItem>
              <SelectItem value="standard">Hàng thường</SelectItem>
              <SelectItem value="fragile">Hàng dễ vỡ</SelectItem>
              <SelectItem value="bulky">Hàng cồng kềnh</SelectItem>
              <SelectItem value="express">Giao hàng nhanh</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Chọn lớp giao hàng phù hợp để tính phí vận chuyển chính xác
          </p>
        </div>

        {/* Tax Status & Tax Class - Grid 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tax Status */}
          <div className="space-y-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-tax-status" className="text-slate-900">Trạng thái thuế</Label>
            </div>
            <Select
              value={watch('taxStatus') || 'taxable'}
              onValueChange={(value) => {
                setValue('taxStatus', value as 'taxable' | 'shipping' | 'none', { shouldDirty: true });
              }}
            >
              <SelectTrigger 
                id="quick-edit-tax-status"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                aria-label="Trạng thái thuế"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="taxable">Có thuế</SelectItem>
                <SelectItem value="shipping">Chỉ thuế vận chuyển</SelectItem>
                <SelectItem value="none">Không có thuế</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Xác định sản phẩm có chịu thuế hay không
            </p>
          </div>

          {/* Tax Class */}
          <div className="space-y-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-tax-class" className="text-slate-900">Loại thuế</Label>
            </div>
            <Select
              value={watch('taxClass') || '__none__'}
              onValueChange={(value) => {
                setValue('taxClass', value === '__none__' ? undefined : value, { shouldDirty: true });
              }}
            >
              <SelectTrigger 
                id="quick-edit-tax-class"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                aria-label="Loại thuế"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Mặc định</SelectItem>
                <SelectItem value="standard">Thuế tiêu chuẩn</SelectItem>
                <SelectItem value="reduced-rate">Thuế giảm</SelectItem>
                <SelectItem value="zero-rate">Thuế 0%</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Chọn loại thuế áp dụng cho sản phẩm (chỉ áp dụng khi trạng thái thuế = &quot;Có thuế&quot;)
            </p>
          </div>
        </div>
      </div>
    </>
  );
});

ShippingSection.displayName = 'ShippingSection';

