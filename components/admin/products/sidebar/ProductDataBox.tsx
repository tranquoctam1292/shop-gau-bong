'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Package, Box } from 'lucide-react';

interface ProductDataBoxProps {
  sku: string;
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  onSkuChange: (sku: string) => void;
  onStockStatusChange?: (status: 'instock' | 'outofstock' | 'onbackorder') => void;
  onStockQuantityChange?: (quantity: number) => void;
  onLengthChange?: (length: number | undefined) => void;
  onWidthChange?: (width: number | undefined) => void;
  onHeightChange?: (height: number | undefined) => void;
  onWeightChange?: (weight: number | undefined) => void;
}

/**
 * Product Data Box - Sidebar component cho product data management
 * Features:
 * - SKU input
 * - Stock status selector
 * - Stock quantity input
 * - Dimensions (Length, Width, Height)
 * - Weight input
 */
export function ProductDataBox({
  sku,
  stockStatus = 'instock',
  stockQuantity,
  length,
  width,
  height,
  weight,
  onSkuChange,
  onStockStatusChange,
  onStockQuantityChange,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  onWeightChange,
}: ProductDataBoxProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Dữ liệu sản phẩm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SKU */}
        <div className="space-y-2">
          <Label htmlFor="sidebar-sku">SKU</Label>
          <Input
            id="sidebar-sku"
            type="text"
            placeholder="VD: PROD-001"
            value={sku}
            onChange={(e) => onSkuChange(e.target.value)}
          />
        </div>

        {/* Stock Status */}
        {onStockStatusChange && (
          <div className="space-y-2">
            <Label htmlFor="sidebar-stock-status">Trạng thái tồn kho</Label>
            <Select
              id="sidebar-stock-status"
              value={stockStatus}
              onChange={(e) =>
                onStockStatusChange(
                  e.target.value as 'instock' | 'outofstock' | 'onbackorder'
                )
              }
            >
              <option value="instock">Còn hàng</option>
              <option value="outofstock">Hết hàng</option>
              <option value="onbackorder">Đặt hàng trước</option>
            </Select>
          </div>
        )}

        {/* Stock Quantity */}
        {onStockQuantityChange && (
          <div className="space-y-2">
            <Label htmlFor="sidebar-stock-quantity">Số lượng tồn kho</Label>
            <Input
              id="sidebar-stock-quantity"
              type="number"
              min="0"
              placeholder="0"
              value={stockQuantity || ''}
              onChange={(e) =>
                onStockQuantityChange(parseInt(e.target.value) || 0)
              }
            />
          </div>
        )}

        {/* Dimensions */}
        {(onLengthChange || onWidthChange || onHeightChange) && (
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Box className="h-4 w-4" />
              Kích thước (cm)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {onLengthChange && (
                <div className="space-y-1">
                  <Label htmlFor="sidebar-length" className="text-xs">
                    Dài
                  </Label>
                  <Input
                    id="sidebar-length"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={length || ''}
                    onChange={(e) =>
                      onLengthChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              )}
              {onWidthChange && (
                <div className="space-y-1">
                  <Label htmlFor="sidebar-width" className="text-xs">
                    Rộng
                  </Label>
                  <Input
                    id="sidebar-width"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={width || ''}
                    onChange={(e) =>
                      onWidthChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              )}
              {onHeightChange && (
                <div className="space-y-1">
                  <Label htmlFor="sidebar-height" className="text-xs">
                    Cao
                  </Label>
                  <Input
                    id="sidebar-height"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={height || ''}
                    onChange={(e) =>
                      onHeightChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weight */}
        {onWeightChange && (
          <div className="space-y-2">
            <Label htmlFor="sidebar-weight">Trọng lượng (kg)</Label>
            <Input
              id="sidebar-weight"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={weight || ''}
              onChange={(e) =>
                onWeightChange(
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
