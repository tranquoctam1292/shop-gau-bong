'use client';

import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowRight, Info } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';
import { ProductSearchInput } from './ProductSearchInput';

interface LinkedProductsTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
  productId?: string; // Exclude current product from search
}

/**
 * Linked Products Tab - Upsells and Cross-sells
 * Features:
 * - Upsells section với product search
 * - Cross-sells section với product search
 * - Selected products display (chips)
 * - Remove product functionality
 */
export function LinkedProductsTab({ state, onUpdate, productId }: LinkedProductsTabProps) {
  // Exclude current product and products already in the other section
  const upsellExcludeIds = productId 
    ? [productId, ...state.crossSellIds]
    : [...state.crossSellIds];
  
  const crossSellExcludeIds = productId
    ? [productId, ...state.upsellIds]
    : [...state.upsellIds];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Sản phẩm liên kết</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Gợi ý các sản phẩm liên quan để tăng doanh số bán hàng
        </p>
      </div>

      {/* Upsells Section */}
      <div className="space-y-3 p-4 border border-input rounded-lg bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                Bán thêm (Upsells)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Gợi ý sản phẩm cao cấp hơn để khách thay thế sản phẩm hiện tại. 
                Hiển thị ở trang chi tiết sản phẩm.
              </p>
            </div>
            <ProductSearchInput
              value={state.upsellIds}
              onChange={(ids) => onUpdate({ upsellIds: ids })}
              placeholder="Tìm kiếm sản phẩm để bán thêm..."
              excludeIds={upsellExcludeIds}
            />
          </div>
        </div>
      </div>

      {/* Cross-sells Section */}
      <div className="space-y-3 p-4 border border-input rounded-lg bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                Bán chéo (Cross-sells)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Gợi ý sản phẩm mua kèm với sản phẩm hiện tại. 
                Hiển thị ở trang Giỏ hàng và Checkout.
              </p>
            </div>
            <ProductSearchInput
              value={state.crossSellIds}
              onChange={(ids) => onUpdate({ crossSellIds: ids })}
              placeholder="Tìm kiếm sản phẩm để bán chéo..."
              excludeIds={crossSellExcludeIds}
            />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-200 space-y-1">
            <p className="font-medium">Sự khác biệt giữa Upsells và Cross-sells:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Bán thêm (Upsells):</strong> Sản phẩm cao cấp hơn, hiển thị khi khách đang xem sản phẩm hiện tại
              </li>
              <li>
                <strong>Bán chéo (Cross-sells):</strong> Sản phẩm bổ sung, hiển thị khi khách đã thêm sản phẩm vào giỏ hàng
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
