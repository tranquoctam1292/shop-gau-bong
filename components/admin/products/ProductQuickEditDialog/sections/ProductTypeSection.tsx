'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';

/**
 * Product Type Section Component
 * 
 * PHASE 2: Extract Form Sections - ProductTypeSection
 * 
 * Displays product type, visibility, and password fields
 * Uses Context API to access form state and handlers
 * 
 * @param showProductTypeWarning - State to show warning dialog
 * @param setShowProductTypeWarning - Setter for warning dialog
 * @param pendingProductType - Pending product type when warning is shown
 * @param setPendingProductType - Setter for pending product type
 */
interface ProductTypeSectionProps {
  showProductTypeWarning: boolean;
  setShowProductTypeWarning: (show: boolean) => void;
  pendingProductType: 'simple' | 'variable' | 'grouped' | 'external' | null;
  setPendingProductType: (type: 'simple' | 'variable' | 'grouped' | 'external' | null) => void;
}

export const ProductTypeSection = memo(function ProductTypeSection({
  showProductTypeWarning,
  setShowProductTypeWarning,
  pendingProductType,
  setPendingProductType,
}: ProductTypeSectionProps) {
  const {
    watch,
    setValue,
    register,
    errors,
    getFieldClassName,
    savedFields,
    variants,
  } = useQuickEditFormContext();

  const productType = watch('productType');
  const visibility = watch('visibility');
  const password = watch('password');
  const hasVariants = variants && variants.length > 0;

  return (
    <>
      {/* PHASE 2: Product Type & Visibility Section (4.2.3) */}
      {/* UX/UI UPGRADE Phase 1.1.2: Section spacing và borders */}
      {/* PHASE 5.3.3: Optimize Grid Layout - Product Type 2 cột */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding and spacing on mobile */}
      <div className="bg-slate-50 border border-slate-200 border-t-slate-300 rounded-md p-3 md:p-4 space-y-4 mb-4 md:mb-6">
        {/* Product Type & Visibility - Grid 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Type */}
          <div className="space-y-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-product-type" className="text-slate-900">Loại sản phẩm</Label>
            </div>
            <Select
              value={productType}
              onValueChange={(value) => {
                const newType = value as 'simple' | 'variable' | 'grouped' | 'external';
                const currentType = productType || 'simple';
                
                // PHASE 2: Warning khi change từ variable sang simple/grouped/external (4.2.3)
                if (currentType === 'variable' && newType !== 'variable' && hasVariants) {
                  setPendingProductType(newType);
                  setShowProductTypeWarning(true);
                } else {
                  setValue('productType', newType, { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger 
                id="quick-edit-product-type"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                aria-label="Loại sản phẩm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Đơn giản</SelectItem>
                <SelectItem value="variable">Có biến thể</SelectItem>
                <SelectItem value="grouped">Nhóm sản phẩm</SelectItem>
                <SelectItem value="external">Sản phẩm ngoài</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Loại sản phẩm xác định cách sản phẩm được bán và quản lý
            </p>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-visibility" className="text-slate-900">Hiển thị</Label>
            </div>
            <Select
              value={visibility}
              onValueChange={(value) => {
                setValue('visibility', value as 'public' | 'private' | 'password', { shouldDirty: true });
                // Clear password if not password-protected
                if (value !== 'password') {
                  setValue('password', '', { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger 
                id="quick-edit-visibility"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                aria-label="Tùy chọn hiển thị sản phẩm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Công khai</SelectItem>
                <SelectItem value="private">Riêng tư</SelectItem>
                <SelectItem value="password">Bảo vệ bằng mật khẩu</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Xác định ai có thể xem sản phẩm này
            </p>
          </div>
        </div>

        {/* Password (conditional) */}
        {visibility === 'password' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="min-h-[21px]">
              <Label htmlFor="quick-edit-password" className="text-slate-900">Mật khẩu</Label>
            </div>
            {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
            <Input
              id="quick-edit-password"
              type="password"
              {...register('password')}
              className={getFieldClassName('password', password, !!errors.password, savedFields.has('password'), 'quick-edit-password')}
              placeholder="Nhập mật khẩu để bảo vệ sản phẩm..."
              aria-label="Mật khẩu bảo vệ sản phẩm"
              aria-describedby={errors.password ? 'quick-edit-password-error' : 'quick-edit-password-help'}
            />
            {errors.password && (
              <p id="quick-edit-password-error" className="text-xs text-red-500" role="alert">{errors.password.message}</p>
            )}
            <p id="quick-edit-password-help" className="sr-only">Mật khẩu để khách hàng truy cập sản phẩm này</p>
            <p className="text-xs text-slate-500">
              Mật khẩu để khách hàng truy cập sản phẩm này
            </p>
          </div>
        )}
      </div>
    </>
  );
});

ProductTypeSection.displayName = 'ProductTypeSection';

