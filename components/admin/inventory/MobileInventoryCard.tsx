'use client';

/**
 * Mobile Inventory Card Component
 * Card-based layout for inventory items on mobile devices
 */

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { InventoryItem, InventoryVariantItem } from '@/types/inventory';

interface MobileInventoryCardProps {
  item: InventoryItem;
  onAdjust: (product: InventoryItem, variantId?: string) => void;
}

export function MobileInventoryCard({ item, onAdjust }: MobileInventoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStockBadge = (
    available: number,
    isLowStock: boolean
  ) => {
    if (available <= 0) {
      return <Badge variant="destructive">Hết hàng</Badge>;
    }
    if (isLowStock) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Tồn thấp
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Còn hàng
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Main Product Row */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer active:bg-gray-50"
          onClick={() => item.variants && setExpanded(!expanded)}
        >
          {/* Thumbnail */}
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.productName}
              width={56}
              height={56}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 text-xs">No img</span>
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.productName}</p>
            {item.sku && (
              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {getStockBadge(item.availableQuantity, item.isLowStock)}
              {item.type === 'variable' && (
                <span className="text-xs text-gray-500">
                  {item.variants?.length || 0} biến thể
                </span>
              )}
            </div>
          </div>

          {/* Stock Info & Actions */}
          <div className="flex flex-col items-end gap-1">
            <div className="text-right">
              <p className="font-bold text-lg">{item.availableQuantity}</p>
              <p className="text-xs text-gray-500">có thể bán</p>
            </div>
            {item.type === 'variable' ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjust(item);
                }}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Sửa
              </Button>
            )}
          </div>
        </div>

        {/* Stock Details Row */}
        {item.reservedQuantity > 0 && (
          <div className="px-4 pb-2 -mt-2">
            <div className="text-xs text-gray-500 flex gap-4">
              <span>Tổng: {item.stockQuantity}</span>
              <span>Đã đặt: {item.reservedQuantity}</span>
            </div>
          </div>
        )}

        {/* Variants (Expanded) */}
        {expanded && item.variants && (
          <div className="border-t bg-gray-50">
            {item.variants.map((variant) => (
              <VariantRow
                key={variant.variationId}
                variant={variant}
                onAdjust={() => onAdjust(item, variant.variationId)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface VariantRowProps {
  variant: InventoryVariantItem;
  onAdjust: () => void;
}

function VariantRow({ variant, onAdjust }: VariantRowProps) {
  const getVariantBadge = () => {
    if (variant.availableQuantity <= 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Hết
        </Badge>
      );
    }
    if (variant.isLowStock) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
          Thấp
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
        OK
      </Badge>
    );
  };

  const variantLabel = [variant.size, variant.color].filter(Boolean).join(' / ');

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{variantLabel || 'Default'}</p>
        {variant.sku && (
          <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {getVariantBadge()}
          <span className="text-xs text-gray-500">
            Tồn: {variant.stockQuantity}
            {variant.reservedQuantity > 0 && ` (${variant.reservedQuantity} đặt)`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-bold">{variant.availableQuantity}</p>
          <p className="text-xs text-gray-500">có thể bán</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={(e) => {
            e.stopPropagation();
            onAdjust();
          }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
