'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DollarSign, TrendingUp, TrendingDown, Package, Loader2 } from 'lucide-react';
import type { Variation } from './VariationTable';
import type { Attribute } from './AttributeItem';

interface VariationsBulkEditToolbarProps {
  variations: Variation[];
  attributes: Attribute[];
  onBulkUpdate: (updates: Partial<Variation>, filter: FilterOptions) => void;
  onVariationsChange?: (variations: Variation[]) => void;
}

interface FilterOptions {
  attributeName?: string;
  attributeValue?: string;
  applyToAll?: boolean;
}

export function VariationsBulkEditToolbar({
  variations,
  attributes,
  onBulkUpdate,
  onVariationsChange,
}: VariationsBulkEditToolbarProps) {
  const [filter, setFilter] = useState<FilterOptions>({ applyToAll: true });
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPercentModal, setShowPercentModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [priceValue, setPriceValue] = useState('');
  const [percentValue, setPercentValue] = useState('');
  const [stockStatus, setStockStatus] = useState<'instock' | 'outofstock'>('instock');
  const [isApplying, setIsApplying] = useState(false);

  // Get unique attribute values for filter dropdown
  const filterOptions = useMemo(() => {
    const options: Array<{ attributeName: string; value: string }> = [];
    
    attributes.forEach((attr) => {
      attr.values.forEach((value) => {
        options.push({ attributeName: attr.name, value });
      });
    });

    return options;
  }, [attributes]);

  // Get filtered variations count
  const filteredCount = useMemo(() => {
    if (filter.applyToAll) {
      return variations.length;
    }
    if (!filter.attributeName || !filter.attributeValue) {
      return variations.length;
    }

    return variations.filter((variation) => {
      return variation.attributes[filter.attributeName!] === filter.attributeValue;
    }).length;
  }, [variations, filter]);

  const handleSetPrice = async () => {
    if (!priceValue || isNaN(parseFloat(priceValue))) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    const price = parseFloat(priceValue);
    if (!isFinite(price) || price < 0) {
      alert('Giá phải là số hợp lệ và không âm');
      return;
    }

    setIsApplying(true);
    try {
      
      // Update via onVariationsChange if available for better performance
      if (onVariationsChange) {
        const updatedVariations = variations.map((variation) => {
          const matchesFilter = filter.applyToAll
            ? true
            : filter.attributeName && filter.attributeValue
            ? variation.attributes[filter.attributeName] === filter.attributeValue
            : true;

          if (matchesFilter) {
            return { ...variation, regularPrice: price };
          }
          return variation;
        });
        onVariationsChange(updatedVariations);
      } else {
        onBulkUpdate({ regularPrice: price }, filter);
      }
      
      setShowPriceModal(false);
      setPriceValue('');
    } finally {
      setIsApplying(false);
    }
  };

  const handleAdjustPrice = async () => {
    if (!percentValue || isNaN(parseFloat(percentValue))) {
      alert('Vui lòng nhập phần trăm hợp lệ');
      return;
    }

    const percent = parseFloat(percentValue);
    if (percent === 0 || !isFinite(percent)) {
      alert('Phần trăm phải khác 0 và là số hợp lệ');
      return;
    }

    setIsApplying(true);
    try {
      // Get filtered variations and calculate new prices
      const updatedVariations = variations.map((variation) => {
        // Check if variation matches filter
        const matchesFilter = filter.applyToAll
          ? true
          : filter.attributeName && filter.attributeValue
          ? variation.attributes[filter.attributeName] === filter.attributeValue
          : true;

        // Validate regularPrice before calculation
        if (
          matchesFilter &&
          variation.regularPrice !== undefined &&
          variation.regularPrice !== null &&
          isFinite(variation.regularPrice) &&
          variation.regularPrice >= 0
        ) {
          const newPrice = variation.regularPrice * (1 + percent / 100);
          // Ensure new price is valid
          if (isFinite(newPrice) && newPrice >= 0) {
            return {
              ...variation,
              regularPrice: newPrice,
            };
          }
        }
        return variation;
      });

      // Update via onVariationsChange if available
      if (onVariationsChange) {
        onVariationsChange(updatedVariations);
      } else {
        // Fallback: use onBulkUpdate for each variation
        updatedVariations.forEach((variation) => {
          const original = variations.find((v) => v.id === variation.id);
          if (original && original.regularPrice !== variation.regularPrice) {
            // This will be handled by parent component
            onBulkUpdate(
              { regularPrice: variation.regularPrice },
              { applyToAll: false, attributeName: undefined, attributeValue: variation.id }
            );
          }
        });
      }

      setShowPercentModal(false);
      setPercentValue('');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSetStockStatus = async () => {
    setIsApplying(true);
    try {
      const stockQty = stockStatus === 'instock' ? 1 : 0;
      
      // Update via onVariationsChange if available for better performance
      if (onVariationsChange) {
        const updatedVariations = variations.map((variation) => {
          const matchesFilter = filter.applyToAll
            ? true
            : filter.attributeName && filter.attributeValue
            ? variation.attributes[filter.attributeName] === filter.attributeValue
            : true;

          if (matchesFilter) {
            return { ...variation, stockQuantity: stockQty };
          }
          return variation;
        });
        onVariationsChange(updatedVariations);
      } else {
        onBulkUpdate({ stockQuantity: stockQty }, filter);
      }
      
      setShowStockModal(false);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <div className="p-4 border border-input rounded-lg bg-muted/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Xử lý hàng loạt</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Áp dụng cho: <span className="font-medium">{filteredCount}</span> biến thể
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Áp dụng cho</Label>
            <Select
              value={filter.applyToAll ? 'all' : 'filtered'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setFilter({ applyToAll: true });
                } else {
                  setFilter({ applyToAll: false });
                }
              }}
            >
              <option value="all">Tất cả biến thể</option>
              <option value="filtered">Lọc theo thuộc tính</option>
            </Select>
          </div>

          {!filter.applyToAll && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Thuộc tính</Label>
                <Select
                  value={filter.attributeName || ''}
                  onChange={(e) => {
                    setFilter({
                      applyToAll: false,
                      attributeName: e.target.value,
                      attributeValue: undefined,
                    });
                  }}
                >
                  <option value="">Chọn thuộc tính...</option>
                  {attributes.map((attr) => (
                    <option key={attr.id} value={attr.name}>
                      {attr.name}
                    </option>
                  ))}
                </Select>
              </div>

              {filter.attributeName && (
                <div className="space-y-2">
                  <Label className="text-xs">Giá trị</Label>
                  <Select
                    value={filter.attributeValue || ''}
                    onChange={(e) => {
                      setFilter({
                        applyToAll: false,
                        attributeName: filter.attributeName,
                        attributeValue: e.target.value,
                      });
                    }}
                  >
                    <option value="">Chọn giá trị...</option>
                    {filterOptions
                      .filter((opt) => opt.attributeName === filter.attributeName)
                      .map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                          {opt.value}
                        </option>
                      ))}
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPriceModal(true)}
            disabled={filteredCount === 0}
            className="flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Thiết lập giá thường
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPercentModal(true)}
            disabled={filteredCount === 0}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Tăng/Giảm giá (%)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowStockModal(true)}
            disabled={filteredCount === 0}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Quản lý kho
          </Button>
        </div>
      </div>

      {/* Set Price Modal */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thiết lập giá thường</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Giá (VNĐ)</Label>
              <Input
                type="number"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Sẽ áp dụng cho <strong>{filteredCount}</strong> biến thể đã lọc.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSetPrice} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang áp dụng...
                </>
              ) : (
                'Áp dụng'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Price Modal */}
      <Dialog open={showPercentModal} onOpenChange={setShowPercentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tăng/Giảm giá theo %</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phần trăm (%)</Label>
              <Input
                type="number"
                value={percentValue}
                onChange={(e) => setPercentValue(e.target.value)}
                placeholder="10 (tăng 10%) hoặc -10 (giảm 10%)"
                step="1"
              />
              <p className="text-xs text-muted-foreground">
                Nhập số dương để tăng, số âm để giảm (ví dụ: 10 = tăng 10%, -10 = giảm 10%)
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Sẽ áp dụng cho <strong>{filteredCount}</strong> biến thể đã lọc.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPercentModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleAdjustPrice} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang áp dụng...
                </>
              ) : (
                'Áp dụng'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Status Modal */}
      <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quản lý kho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái kho</Label>
              <Select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as 'instock' | 'outofstock')}
              >
                <option value="instock">Còn hàng</option>
                <option value="outofstock">Hết hàng</option>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Sẽ áp dụng cho <strong>{filteredCount}</strong> biến thể đã lọc.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSetStockStatus} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang áp dụng...
                </>
              ) : (
                'Áp dụng'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
