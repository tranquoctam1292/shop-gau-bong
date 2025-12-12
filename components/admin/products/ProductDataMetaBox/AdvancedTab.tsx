'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';

interface AdvancedTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
}

/**
 * Advanced Tab - Purchase Note, Menu Order, Reviews
 * Features:
 * - Purchase Note textarea
 * - Menu Order number input
 * - Enable Reviews checkbox
 */
export function AdvancedTab({ state, onUpdate }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Nâng cao</h3>

        {/* Purchase Note */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="purchaseNote" className="text-sm font-medium">
            Ghi chú mua hàng
          </Label>
          <Textarea
            id="purchaseNote"
            placeholder="Gửi cho khách sau khi mua xong (trong email)"
            value={state.purchaseNote || ''}
            onChange={(e) => onUpdate({ purchaseNote: e.target.value || undefined })}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Ghi chú này sẽ được gửi cho khách hàng trong email xác nhận đơn hàng
          </p>
        </div>

        {/* Menu Order */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="menuOrder" className="text-sm font-medium">
            Thứ tự sắp xếp
          </Label>
          <Input
            id="menuOrder"
            type="number"
            value={state.menuOrder || 0}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              onUpdate({ menuOrder: isNaN(value) ? 0 : value });
            }}
            min={0}
            step={1}
            className="w-32"
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Dùng để sắp xếp vị trí hiển thị sản phẩm. Số nhỏ hơn sẽ hiển thị trước.</p>
          </div>
        </div>

        {/* Enable Reviews */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enableReviews"
              checked={state.enableReviews ?? true}
              onCheckedChange={(checked) => onUpdate({ enableReviews: checked as boolean })}
            />
            <Label htmlFor="enableReviews" className="text-sm font-medium cursor-pointer">
              Bật đánh giá và bình luận
            </Label>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground ml-6">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Bật/tắt tính năng đánh giá và bình luận cho sản phẩm này</p>
          </div>
        </div>
      </div>
    </div>
  );
}
