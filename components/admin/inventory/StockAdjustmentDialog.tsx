'use client';

/**
 * Stock Adjustment Dialog
 * Dialog de dieu chinh ton kho cho san pham
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Package } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';

// ============================================
// Types
// ============================================

type AdjustmentType = 'manual' | 'damage' | 'correction' | 'return' | 'import';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: InventoryItem | null;
  variantId?: string;
  onSubmit: (
    quantity: number,
    type: AdjustmentType,
    reason: string
  ) => Promise<void>;
  isLoading?: boolean;
}

const adjustmentTypes: { value: AdjustmentType; label: string }[] = [
  { value: 'manual', label: 'Điều chỉnh thủ công' },
  { value: 'import', label: 'Nhập hàng' },
  { value: 'return', label: 'Hàng trả lại' },
  { value: 'damage', label: 'Hàng hư hỏng' },
  { value: 'correction', label: 'Sửa lỗi số liệu' },
];

// ============================================
// Component
// ============================================

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  variantId,
  onSubmit,
  isLoading = false,
}: StockAdjustmentDialogProps) {
  // Form state
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('manual');
  const [direction, setDirection] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get current variant info if applicable
  const variant = variantId
    ? product?.variants?.find((v) => v.variationId === variantId)
    : null;

  const currentStock = variant?.stockQuantity ?? product?.stockQuantity ?? 0;
  const currentAvailable = variant?.availableQuantity ?? product?.availableQuantity ?? 0;

  // Get variant label
  const getVariantLabel = () => {
    if (!variant) return null;
    const parts = [];
    if (variant.size) parts.push(`Size: ${variant.size}`);
    if (variant.color) parts.push(`Màu: ${variant.color}`);
    return parts.join(' - ') || variant.sku || variantId;
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAdjustmentType('manual');
      setDirection('add');
      setQuantity('');
      setReason('');
      setError(null);
    }
  }, [open]);

  // Calculate new stock
  const numQuantity = parseInt(quantity, 10) || 0;
  const finalQuantity = direction === 'add' ? numQuantity : -numQuantity;
  const newStock = currentStock + finalQuantity;

  // Handle submit
  const handleSubmit = async () => {
    // Validate
    if (!quantity || numQuantity <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ (> 0)');
      return;
    }

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do điều chỉnh');
      return;
    }

    if (newStock < 0) {
      setError(`Không thể giảm ${numQuantity} đơn vị. Tồn kho hiện tại: ${currentStock}`);
      return;
    }

    setError(null);

    try {
      await onSubmit(finalQuantity, adjustmentType, reason.trim());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra khi điều chỉnh tồn kho');
      }
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Điều chỉnh tồn kho
          </DialogTitle>
          <DialogDescription>
            Điều chỉnh số lượng tồn kho cho sản phẩm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Product Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{product.productName}</p>
            {variant && (
              <Badge variant="secondary" className="mt-1">
                {getVariantLabel()}
              </Badge>
            )}
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>Tồn kho: <span className="font-medium text-foreground">{currentStock}</span></span>
              <span>Có thể bán: <span className="font-medium text-foreground">{currentAvailable}</span></span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="adjustment-type">Loại điều chỉnh</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as AdjustmentType)}
            >
              <SelectTrigger id="adjustment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adjustmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Direction + Quantity */}
          <div className="space-y-2">
            <Label>Số lượng</Label>
            <div className="flex gap-2">
              <div className="flex rounded-md border">
                <Button
                  type="button"
                  variant={direction === 'add' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setDirection('add')}
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
                <Button
                  type="button"
                  variant={direction === 'subtract' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setDirection('subtract')}
                >
                  <ArrowDown className="h-4 w-4 mr-1" />
                  Giảm
                </Button>
              </div>
              <Input
                type="number"
                placeholder="Số lượng"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError(null);
                }}
                min="1"
                className="flex-1"
              />
            </div>
          </div>

          {/* New Stock Preview */}
          {numQuantity > 0 && (
            <div className={`p-3 rounded-lg border ${newStock < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-sm ${newStock < 0 ? 'text-red-800' : 'text-green-800'}`}>
                Tồn kho mới: <strong>{currentStock}</strong> {direction === 'add' ? '+' : '-'} {numQuantity} = <strong>{newStock}</strong>
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do <span className="text-red-500">*</span></Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do điều chỉnh..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !quantity || !reason.trim()}
            className="min-h-[44px]"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
