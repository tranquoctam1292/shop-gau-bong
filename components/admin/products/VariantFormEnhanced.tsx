'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export interface EnhancedVariant {
  id: string;
  size: string;
  color?: string;
  colorCode?: string; // hex/rgb
  price: number;
  stock: number;
  image?: string; // Variant-specific image
  sku?: string;
  stockAlertThreshold?: number; // Cảnh báo khi stock < threshold
  pricingRule?: {
    type: 'fixed' | 'percentage' | 'formula';
    value: number;
  };
}

interface VariantFormEnhancedProps {
  variants: EnhancedVariant[];
  onChange: (variants: EnhancedVariant[]) => void;
  baseSku?: string; // Base SKU để auto-generate variant SKU
}

export function VariantFormEnhanced({ variants, onChange, baseSku }: VariantFormEnhancedProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const addVariant = () => {
    const newVariant: EnhancedVariant = {
      id: `variant-${Date.now()}`,
      size: '',
      price: 0,
      stock: 0,
      stockAlertThreshold: 10, // Default threshold
    };
    onChange([...variants, newVariant]);
    setSelectedVariant(newVariant.id);
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
    if (selectedVariant === id) {
      setSelectedVariant(null);
    }
  };

  const updateVariant = (id: string, field: keyof EnhancedVariant, value: any) => {
    const updated = variants.map((v) => {
      if (v.id === id) {
        const updatedVariant = { ...v, [field]: value };
        
        // Auto-generate SKU nếu có baseSku
        if (field === 'size' && baseSku && !updatedVariant.sku) {
          updatedVariant.sku = `${baseSku}-${value}`.toUpperCase().replace(/\s+/g, '-');
        }
        
        return updatedVariant;
      }
      return v;
    });
    onChange(updated);
  };

  const updatePricingRule = (id: string, type: 'fixed' | 'percentage' | 'formula', value: number) => {
    updateVariant(id, 'pricingRule', { type, value });
  };

  const getStockStatus = (stock: number, threshold?: number) => {
    if (stock === 0) return { text: 'Hết hàng', color: 'text-red-600' };
    if (threshold && stock < threshold) return { text: 'Sắp hết', color: 'text-yellow-600' };
    return { text: 'Còn hàng', color: 'text-green-600' };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Biến thể sản phẩm nâng cao</CardTitle>
        <Button type="button" onClick={addVariant} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Thêm biến thể
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Chưa có biến thể nào. Click "Thêm biến thể" để bắt đầu.
          </p>
        ) : (
          variants.map((variant) => {
            const stockStatus = getStockStatus(variant.stock, variant.stockAlertThreshold);
            const isLowStock = variant.stockAlertThreshold && variant.stock < variant.stockAlertThreshold;

            return (
              <div
                key={variant.id}
                className={`border rounded-lg p-4 space-y-3 ${
                  selectedVariant === variant.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      Biến thể {variant.size || 'Mới'}
                      {variant.color && ` - ${variant.color}`}
                    </h4>
                    {isLowStock && (
                      <div className="flex items-center gap-1 text-yellow-600 text-sm mt-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Cảnh báo: Sắp hết hàng</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariant(variant.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Kích thước *</Label>
                    <Input
                      value={variant.size}
                      onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Màu sắc</Label>
                    <Input
                      value={variant.color || ''}
                      onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                      placeholder="Ví dụ: Hồng, Xanh"
                    />
                  </div>

                  <div>
                    <Label>Mã màu (Hex/RGB)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={variant.colorCode || '#000000'}
                        onChange={(e) => updateVariant(variant.id, 'colorCode', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={variant.colorCode || ''}
                        onChange={(e) => updateVariant(variant.id, 'colorCode', e.target.value)}
                        placeholder="#FF5733"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Giá *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={variant.price}
                      onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Số lượng *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                      required
                    />
                    <p className={`text-xs mt-1 ${stockStatus.color}`}>
                      {stockStatus.text}
                    </p>
                  </div>

                  <div>
                    <Label>Ngưỡng cảnh báo tồn kho</Label>
                    <Input
                      type="number"
                      min="0"
                      value={variant.stockAlertThreshold || 10}
                      onChange={(e) => updateVariant(variant.id, 'stockAlertThreshold', parseInt(e.target.value) || 10)}
                      placeholder="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cảnh báo khi số lượng &lt; ngưỡng này
                    </p>
                  </div>

                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={variant.sku || ''}
                      onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                      placeholder="Auto-generated từ base SKU"
                    />
                  </div>

                  <div>
                    <Label>URL ảnh biến thể</Label>
                    <Input
                      type="url"
                      value={variant.image || ''}
                      onChange={(e) => updateVariant(variant.id, 'image', e.target.value)}
                      placeholder="https://example.com/variant-image.jpg"
                    />
                  </div>
                </div>

                {/* Pricing Rule */}
                <div className="border-t pt-3">
                  <Label className="mb-2 block">Quy tắc giá (tùy chọn)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={variant.pricingRule?.type || 'fixed'}
                      onChange={(e) => {
                        const type = e.target.value as 'fixed' | 'percentage' | 'formula';
                        updatePricingRule(
                          variant.id,
                          type,
                          variant.pricingRule?.value || 0
                        );
                      }}
                      className="border rounded px-3 py-2"
                    >
                      <option value="fixed">Giá cố định</option>
                      <option value="percentage">Phần trăm</option>
                      <option value="formula">Công thức</option>
                    </select>
                    <Input
                      type="number"
                      value={variant.pricingRule?.value || 0}
                      onChange={(e) => {
                        const type = variant.pricingRule?.type || 'fixed';
                        updatePricingRule(
                          variant.id,
                          type,
                          parseFloat(e.target.value) || 0
                        );
                      }}
                      placeholder="Giá trị"
                    />
                    <p className="text-xs text-gray-500 flex items-center">
                      {variant.pricingRule?.type === 'percentage' && '%'}
                      {variant.pricingRule?.type === 'formula' && 'Công thức'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

