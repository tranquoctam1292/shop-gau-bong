'use client';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProductType } from './ProductDataMetaBox';

interface TopControlBarProps {
  productType: ProductType;
  isVirtual: boolean;
  isDownloadable: boolean;
  onProductTypeChange: (type: ProductType) => void;
  onVirtualChange: (isVirtual: boolean) => void;
  onDownloadableChange: (isDownloadable: boolean) => void;
}

/**
 * Top Control Bar - Product Type and Options
 * Features:
 * - Product Type dropdown
 * - Virtual Product checkbox
 * - Downloadable Product checkbox
 */
export function TopControlBar({
  productType,
  isVirtual,
  isDownloadable,
  onProductTypeChange,
  onVirtualChange,
  onDownloadableChange,
}: TopControlBarProps) {
  return (
    <div className="h-[60px] px-4 border-b border-input bg-muted/50 flex items-center gap-6 flex-wrap">
      {/* Product Type */}
      <div className="flex items-center gap-3">
        <Label htmlFor="product-type" className="text-sm font-semibold whitespace-nowrap">
          Loại sản phẩm:
        </Label>
        <Select
          id="product-type"
          value={productType}
          onChange={(e) => onProductTypeChange(e.target.value as ProductType)}
          className="w-[220px] h-9 text-sm"
        >
          <option value="simple">Sản phẩm đơn giản</option>
          <option value="variable">Sản phẩm có biến thể</option>
          <option value="grouped">Sản phẩm nhóm</option>
          <option value="external">Sản phẩm bên ngoài/Liên kết</option>
        </Select>
      </div>

      {/* Checkbox Options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            id="virtual-product"
            checked={isVirtual}
            onCheckedChange={(checked) => onVirtualChange(checked === true)}
          />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
            Sản phẩm ảo
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            id="downloadable-product"
            checked={isDownloadable}
            onCheckedChange={(checked) => onDownloadableChange(checked === true)}
          />
          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
            Có thể tải xuống
          </span>
        </label>
      </div>
    </div>
  );
}
