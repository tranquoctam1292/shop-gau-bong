'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { X, Minus, Plus } from 'lucide-react';
import type { CartItem } from '@/lib/store/cartStore';

interface OrderSummarySectionProps {
  items: CartItem[];
  // FIX: productId and variationId can be string | number (MongoDB ObjectId support)
  onUpdateQuantity: (productId: string | number, quantity: number, variationId?: number | string) => void;
  onRemoveItem: (productId: string | number, variationId?: number | string) => void;
  className?: string;
}

/**
 * Order Summary Section Component
 * 
 * Displays cart items list with quantity controls
 * Modern, polished e-commerce design for Teddy Bear/Gift Shop
 * Used in QuickCheckoutModal - Left column (40% on desktop)
 */
export function OrderSummarySection({
  items,
  onUpdateQuantity,
  onRemoveItem,
  className,
}: OrderSummarySectionProps) {
  return (
    <div className={cn('bg-background p-4 md:p-6 space-y-3', className)}>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variationId || ''}`}
            className="group relative flex gap-4 bg-card p-3 rounded-2xl border border-black/5 hover:border-pink-200 hover:shadow-sm transition-all duration-200"
          >
            {/* Image Container */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border/30 bg-gray-50 ring-1 ring-black/5">
              <Image
                src={item.image || '/images/teddy-placeholder.png'}
                alt={item.productName}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
              {/* Header: Name & Delete */}
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-medium leading-tight text-gray-900 line-clamp-2 flex-1">
                  {item.productName}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.productId, item.variationId);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1 rounded-sm hover:bg-destructive/10"
                  aria-label="Xóa sản phẩm"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Footer: Price & Quantity */}
              <div className="flex items-end justify-between mt-2 gap-2">
                <p className="text-sm font-bold text-[#D6336C] shrink-0">
                  {formatPrice(item.price)}
                </p>

                {/* Modern Pill Quantity Control */}
                <div className="flex items-center gap-1 bg-gray-50 rounded-full border border-gray-200 p-0.5 h-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.productId, item.quantity - 1, item.variationId);
                    }}
                    disabled={item.quantity <= 1}
                    className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm transition-all min-h-[28px] min-w-[28px] p-0"
                    aria-label="Giảm số lượng"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </Button>
                  <span className="w-6 text-center text-xs font-medium text-gray-900">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.productId, item.quantity + 1, item.variationId);
                    }}
                    className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm transition-all min-h-[28px] min-w-[28px] p-0"
                    aria-label="Tăng số lượng"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

