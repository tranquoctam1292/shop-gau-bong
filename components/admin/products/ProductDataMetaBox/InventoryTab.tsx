'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';

interface InventoryTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
  productId?: string; // For SKU validation (exclude current product)
}

/**
 * Inventory Tab - Stock Management
 * Features:
 * - SKU với real-time unique validation
 * - Manage Stock checkbox với conditional fields
 * - Stock Quantity & Low Stock Threshold
 * - Allow Backorders dropdown
 * - Sold Individually checkbox
 */
export function InventoryTab({ state, onUpdate, productId }: InventoryTabProps) {
  const [skuValue, setSkuValue] = useState(state.sku || '');
  const [skuValidating, setSkuValidating] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [skuValid, setSkuValid] = useState<boolean | null>(null);

  // Debounce SKU validation
  useEffect(() => {
    if (!skuValue.trim()) {
      setSkuError(null);
      setSkuValid(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSkuValidating(true);
      setSkuError(null);
      
      try {
        // Call API to validate SKU uniqueness
        const response = await fetch(
          `/api/admin/products/validate-sku?sku=${encodeURIComponent(skuValue)}${productId ? `&excludeId=${productId}` : ''}`,
          { method: 'POST' }
        );
        
        const data = await response.json();
        
        if (response.ok && data.available) {
          setSkuValid(true);
          setSkuError(null);
        } else {
          setSkuValid(false);
          setSkuError(data.error || 'SKU đã tồn tại trong hệ thống');
        }
      } catch (error) {
        console.error('Error validating SKU:', error);
        // Don't show error on network failure, just mark as unknown
        setSkuValid(null);
      } finally {
        setSkuValidating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [skuValue, productId]);

  // Auto-update stock status when quantity changes
  useEffect(() => {
    if (state.manageStock && state.stockQuantity !== undefined) {
      if (state.stockQuantity === 0) {
        onUpdate({ stockStatus: 'outofstock' });
      } else if (state.stockQuantity > 0 && state.stockStatus === 'outofstock') {
        onUpdate({ stockStatus: 'instock' });
      }
    }
  }, [state.stockQuantity, state.manageStock, state.stockStatus, onUpdate]);

  // Stock status options
  const stockStatusOptions = [
    { value: 'instock', label: 'Còn hàng', icon: CheckCircle2, color: 'text-green-600' },
    { value: 'outofstock', label: 'Hết hàng', icon: AlertCircle, color: 'text-red-600' },
    { value: 'onbackorder', label: 'Đặt hàng trước', icon: Package, color: 'text-orange-600' },
  ];

  const currentStatusOption = stockStatusOptions.find((opt) => opt.value === state.stockStatus);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Kiểm kê kho hàng</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Quản lý mã SKU, số lượng tồn kho và các thiết lập liên quan
        </p>
      </div>

      {/* SKU Field */}
      <div className="space-y-2">
        <Label htmlFor="sku" className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Mã sản phẩm (SKU)
          <span className="text-xs text-muted-foreground font-normal">(Tùy chọn)</span>
        </Label>
        <div className="relative">
          <Input
            id="sku"
            type="text"
            placeholder="VD: PROD-001"
            value={skuValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setSkuValue(newValue);
              onUpdate({ sku: newValue || undefined });
            }}
            className={`pr-10 ${skuError ? 'border-red-500' : skuValid ? 'border-green-500' : ''}`}
          />
          {skuValidating && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!skuValidating && skuValid && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
          )}
          {!skuValidating && skuError && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
          )}
        </div>
        {skuError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {skuError}
          </p>
        )}
        {skuValid && !skuError && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            SKU có thể sử dụng
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Mã SKU phải là duy nhất trong toàn bộ hệ thống
        </p>
      </div>

      {/* Manage Stock Checkbox */}
      <div className="space-y-3 p-4 border border-input rounded-lg bg-muted/30">
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            id="manage-stock"
            checked={state.manageStock}
            onCheckedChange={(checked) => {
              onUpdate({ manageStock: checked === true });
              // Reset stock quantity if unchecking
              if (!checked) {
                onUpdate({ stockQuantity: undefined, lowStockThreshold: undefined });
              }
            }}
          />
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            Quản lý kho hàng
          </span>
        </label>
        <p className="text-xs text-muted-foreground ml-6">
          Bật tính năng này để theo dõi số lượng tồn kho chi tiết
        </p>

        {/* Stock Status - Always visible */}
        <div className="space-y-2 ml-6 pt-2 border-t border-input">
          <Label htmlFor="stock-status" className="text-sm font-medium">
            Trạng thái tồn kho
          </Label>
          <Select
            id="stock-status"
            value={state.stockStatus}
            onChange={(e) =>
              onUpdate({ stockStatus: e.target.value as ProductDataMetaBoxState['stockStatus'] })
            }
            className="w-full"
          >
            {stockStatusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </Select>
          {currentStatusOption && (
            <div className="flex items-center gap-2 text-sm">
              <currentStatusOption.icon className={`h-4 w-4 ${currentStatusOption.color}`} />
              <span className={currentStatusOption.color}>
                {currentStatusOption.label}
              </span>
            </div>
          )}
        </div>

        {/* Stock Quantity & Threshold - Only visible when Manage Stock is checked */}
        {state.manageStock && (
          <div className="ml-6 pt-2 border-t border-input space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Stock Quantity */}
              <div className="space-y-2">
                <Label htmlFor="stock-quantity" className="text-sm font-medium">
                  Số lượng trong kho
                </Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={state.stockQuantity || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                    onUpdate({ stockQuantity: value });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Số lượng sẽ tự động giảm khi có đơn hàng
                </p>
              </div>

              {/* Low Stock Threshold */}
              <div className="space-y-2">
                <Label htmlFor="low-stock-threshold" className="text-sm font-medium">
                  Ngưỡng sắp hết hàng
                </Label>
                <Input
                  id="low-stock-threshold"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={state.lowStockThreshold || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                    onUpdate({ lowStockThreshold: value });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Cảnh báo khi số lượng còn lại &lt;= ngưỡng này
                </p>
              </div>
            </div>

            {/* Low Stock Warning */}
            {state.stockQuantity !== undefined &&
              state.lowStockThreshold !== undefined &&
              state.stockQuantity <= state.lowStockThreshold &&
              state.stockQuantity > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  <span>Sắp hết hàng! Số lượng còn lại: {state.stockQuantity}</span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Allow Backorders */}
      <div className="space-y-2">
        <Label htmlFor="backorders" className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          Cho phép đặt hàng trước
        </Label>
        <Select
          id="backorders"
          value={state.backorders}
          onChange={(e) =>
            onUpdate({ backorders: e.target.value as ProductDataMetaBoxState['backorders'] })
          }
          className="w-full"
        >
          <option value="no">Không cho phép</option>
          <option value="notify">Cho phép nhưng thông báo khách</option>
          <option value="yes">Cho phép</option>
        </Select>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Không cho phép:</strong> Khách không thể mua khi hết hàng
          </p>
          <p>
            <strong>Cho phép nhưng thông báo:</strong> Khách có thể mua nhưng sẽ thấy cảnh báo
          </p>
          <p>
            <strong>Cho phép:</strong> Khách có thể mua bình thường ngay cả khi hết hàng
          </p>
        </div>
      </div>

      {/* Sold Individually */}
      <div className="space-y-2 p-4 border border-input rounded-lg bg-muted/30">
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            id="sold-individually"
            checked={state.soldIndividually}
            onCheckedChange={(checked) => onUpdate({ soldIndividually: checked === true })}
          />
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            Bán riêng lẻ
          </span>
        </label>
        <p className="text-xs text-muted-foreground ml-6">
          Chỉ cho phép khách hàng mua tối đa 1 sản phẩm này trong 1 đơn hàng
        </p>
      </div>
    </div>
  );
}
