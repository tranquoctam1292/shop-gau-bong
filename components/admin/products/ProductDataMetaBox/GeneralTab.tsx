'use client';

import { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, TrendingUp, Percent, Calendar, Upload, X, File } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';
import { DownloadableFilesSection } from './DownloadableFilesSection';
import { PriceInput } from '../PriceInput';

interface GeneralTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
}

/**
 * General Tab - Pricing and Downloadable Files
 * Features:
 * - Cost Price (optional, admin only)
 * - Regular Price với real-time profit calculation
 * - Sale Price với schedule dates và discount %
 * - Downloadable Files section (conditional)
 */
export function GeneralTab({ state, onUpdate }: GeneralTabProps) {
  const [showSchedule, setShowSchedule] = useState(
    !!(state.salePriceStartDate || state.salePriceEndDate)
  );

  // Validate salePrice < regularPrice on mount/update
  useEffect(() => {
    if (state.salePrice !== undefined && state.regularPrice !== undefined && state.salePrice >= state.regularPrice) {
      // Auto-fix: clear invalid salePrice
      onUpdate({ salePrice: undefined });
    }
  }, [state.salePrice, state.regularPrice, onUpdate]);

  // Calculate profit in real-time
  const profit = useMemo(() => {
    if (!state.regularPrice || !state.costPrice) return null;
    const profitAmount = state.regularPrice - state.costPrice;
    const profitPercent = state.costPrice > 0 
      ? ((profitAmount / state.costPrice) * 100).toFixed(1)
      : '0';
    return { amount: profitAmount, percent: profitPercent };
  }, [state.regularPrice, state.costPrice]);

  // Calculate discount percentage
  const discountPercent = useMemo(() => {
    if (!state.salePrice || !state.regularPrice) return null;
    const discount = ((state.regularPrice - state.salePrice) / state.regularPrice) * 100;
    return discount.toFixed(1);
  }, [state.salePrice, state.regularPrice]);

  // Check if sale price should be active (date range check)
  const isSaleActive = useMemo(() => {
    if (!state.salePrice || !showSchedule) return true; // Always active if no schedule
    const now = new Date();
    const start = state.salePriceStartDate ? new Date(state.salePriceStartDate) : null;
    const end = state.salePriceEndDate ? new Date(state.salePriceEndDate) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  }, [state.salePrice, state.salePriceStartDate, state.salePriceEndDate, showSchedule]);

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '';
    return new Intl.NumberFormat('vi-VN').format(value);
  };


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Giá sản phẩm</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Thiết lập giá vốn, giá bán và giá khuyến mãi cho sản phẩm
        </p>
      </div>

      {/* Cost Price */}
      <div className="space-y-2">
        <Label htmlFor="cost-price" className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Giá vốn
          <span className="text-xs text-muted-foreground font-normal">(Tùy chọn)</span>
        </Label>
        <PriceInput
          id="cost-price"
          placeholder="0"
          value={state.costPrice}
          onChange={(value) => onUpdate({ costPrice: value })}
        />
        <p className="text-xs text-muted-foreground">
          Giá vốn dùng để tính toán lợi nhuận. Chỉ hiển thị cho admin.
        </p>
      </div>

      {/* Regular Price */}
      <div className="space-y-2">
        <Label htmlFor="regular-price" className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Giá bán thường
          <span className="text-red-500">*</span>
        </Label>
        <PriceInput
          id="regular-price"
          placeholder="0"
          required
          value={state.regularPrice}
          onChange={(value) => onUpdate({ regularPrice: value })}
        />
        {/* Real-time Profit Calculation */}
        {profit && state.costPrice && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">
              Lãi: {formatCurrency(profit.amount)}đ ({profit.percent}%)
            </span>
          </div>
        )}
      </div>

      {/* Sale Price */}
      <div className="space-y-3 p-4 border border-input rounded-lg bg-muted/30">
        <div className="space-y-2">
          <Label htmlFor="sale-price" className="text-sm font-medium flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            Giá khuyến mãi
            <span className="text-xs text-muted-foreground font-normal">(Tùy chọn)</span>
          </Label>
          <PriceInput
            id="sale-price"
            placeholder="0"
            value={state.salePrice}
            onChange={(value) => {
              // Validate: salePrice must be less than regularPrice
              if (value !== undefined && state.regularPrice && value >= state.regularPrice) {
                return; // Don't update if invalid
              }
              onUpdate({ salePrice: value });
            }}
            disabled={!state.regularPrice}
          />
          {state.salePrice && state.regularPrice && discountPercent && (
            <div className="flex items-center gap-2 text-sm">
              <Percent className="h-4 w-4 text-orange-600" />
              <span className="text-orange-600 font-medium">
                Đang giảm {discountPercent}%
              </span>
            </div>
          )}
          {state.salePrice && state.regularPrice && state.salePrice >= state.regularPrice && (
            <p className="text-xs text-red-500">
              Giá khuyến mãi phải nhỏ hơn giá bán thường
            </p>
          )}
        </div>

        {/* Schedule Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            id="schedule-sale"
            checked={showSchedule}
            onCheckedChange={(checked) => {
              setShowSchedule(checked === true);
              if (!checked) {
                onUpdate({ salePriceStartDate: undefined, salePriceEndDate: undefined });
              }
            }}
          />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Lên lịch khuyến mãi
          </span>
        </label>

        {/* Schedule Date Pickers */}
        {showSchedule && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-input">
            <div className="space-y-2">
              <Label htmlFor="sale-start-date" className="text-xs">
                Ngày bắt đầu
              </Label>
              <Input
                id="sale-start-date"
                type="datetime-local"
                value={state.salePriceStartDate || ''}
                onChange={(e) => onUpdate({ salePriceStartDate: e.target.value || undefined })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-end-date" className="text-xs">
                Ngày kết thúc
              </Label>
              <Input
                id="sale-end-date"
                type="datetime-local"
                value={state.salePriceEndDate || ''}
                onChange={(e) => onUpdate({ salePriceEndDate: e.target.value || undefined })}
                className="text-sm"
              />
            </div>
            {!isSaleActive && state.salePrice && (
              <div className="col-span-2 text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                ⚠️ Giá khuyến mãi hiện không hoạt động (ngoài khoảng thời gian đã lên lịch)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Downloadable Files Section */}
      {state.isDownloadable && (
        <div className="pt-6 border-t border-input">
          <DownloadableFilesSection
            files={state.downloadableFiles || []}
            onFilesChange={(files) => onUpdate({ downloadableFiles: files })}
          />
        </div>
      )}
    </div>
  );
}
