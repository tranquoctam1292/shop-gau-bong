'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Package, Ruler, Truck } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';

interface ShippingTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
}

/**
 * Shipping Tab - Weight, Dimensions, Shipping Class
 * Features:
 * - Weight field với unit selector (kg/g)
 * - Dimensions fields (Length, Width, Height) với unit selector (cm/m)
 * - Shipping Class dropdown
 * Note: Tab này sẽ tự động ẩn khi isVirtual = true
 */
export function ShippingTab({ state, onUpdate }: ShippingTabProps) {
  const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg');
  const [dimensionUnit, setDimensionUnit] = useState<'cm' | 'm'>('cm');

  // Shipping class options
  const shippingClasses = [
    { value: '', label: 'Không có' },
    { value: 'standard', label: 'Hàng thường' },
    { value: 'fragile', label: 'Hàng dễ vỡ' },
    { value: 'bulky', label: 'Hàng cồng kềnh' },
    { value: 'express', label: 'Giao hàng nhanh' },
  ];

  // Handle weight change with unit conversion
  const handleWeightChange = (value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    if (numValue !== undefined && numValue < 0) return;
    onUpdate({ weight: numValue });
  };

  // Handle dimension change
  const handleDimensionChange = (field: 'length' | 'width' | 'height', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    if (numValue !== undefined && numValue < 0) return;
    onUpdate({ [field]: numValue });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Giao hàng</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Thiết lập thông tin vận chuyển để tính phí giao hàng chính xác
        </p>
      </div>

      {/* Weight Field */}
      <div className="space-y-2">
        <Label htmlFor="weight" className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Trọng lượng
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={state.weight || ''}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="pr-16"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'g')}
                className="w-12 h-6 text-xs border-0 bg-transparent p-0 focus:ring-0"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
              </Select>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Trọng lượng sản phẩm dùng để tính phí vận chuyển
        </p>
      </div>

      {/* Dimensions Fields */}
      <div className="space-y-3 p-4 border border-input rounded-lg bg-muted/30">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          Kích thước
        </Label>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Đơn vị:</span>
          <Select
            value={dimensionUnit}
            onChange={(e) => setDimensionUnit(e.target.value as 'cm' | 'm')}
            className="w-20 h-8 text-xs"
          >
            <option value="cm">cm</option>
            <option value="m">m</option>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Length */}
          <div className="space-y-2">
            <Label htmlFor="length" className="text-xs font-medium">
              Dài ({dimensionUnit})
            </Label>
            <Input
              id="length"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={state.length || ''}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Width */}
          <div className="space-y-2">
            <Label htmlFor="width" className="text-xs font-medium">
              Rộng ({dimensionUnit})
            </Label>
            <Input
              id="width"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={state.width || ''}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Height */}
          <div className="space-y-2">
            <Label htmlFor="height" className="text-xs font-medium">
              Cao ({dimensionUnit})
            </Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={state.height || ''}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Kích thước sản phẩm (Dài x Rộng x Cao) dùng để tính phí vận chuyển
        </p>
      </div>

      {/* Shipping Class */}
      <div className="space-y-2">
        <Label htmlFor="shipping-class" className="text-sm font-medium flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          Lớp giao hàng
        </Label>
        <Select
          id="shipping-class"
          value={state.shippingClass || ''}
          onChange={(e) => onUpdate({ shippingClass: e.target.value || undefined })}
          className="w-full"
        >
          {shippingClasses.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Chọn lớp giao hàng phù hợp để tính phí vận chuyển chính xác. Ví dụ: Hàng dễ vỡ có thể có phí bảo hiểm cao hơn.
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Lưu ý:</strong> Thông tin trọng lượng và kích thước sẽ được sử dụng để tính phí vận chuyển tự động thông qua các API vận chuyển (Giao Hàng Nhanh, Viettel Post, v.v.)
        </p>
      </div>
    </div>
  );
}
