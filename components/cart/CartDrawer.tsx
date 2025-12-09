'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { useCartStore } from '@/lib/store/cartStore';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useShippingEstimate } from '@/lib/hooks/useShippingEstimate';
import { formatPrice } from '@/lib/utils/format';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  // Thêm state để check mounted - fix hydration error
  const [mounted, setMounted] = useState(false);
  
  const { items, getTotalItems, getTotalPrice } = useCartStore();
  const { updateCartItem, removeFromCart } = useCartSync();
  const { shippingEstimate } = useShippingEstimate();

  // Đợi cho đến khi component được mount trên client
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const totalWithShipping = totalPrice + (shippingEstimate || 0);

  return (
    <>
      {/* Cart Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        🛒
        {/* Chỉ hiển thị span khi đã mounted trên client - fix hydration error */}
        {mounted && totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-background shadow-lg z-[100] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-heading text-xl font-semibold">
              Giỏ hàng ({totalItems})
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-text-muted mb-4">Giỏ hàng trống</p>
                <Link 
                  href="/products" 
                  onClick={() => setIsOpen(false)}
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
                >
                  Xem sản phẩm
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.productId} className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                      <Image
                        src={item.image || '/images/teddy-placeholder.png'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        onClick={() => setIsOpen(false)}
                        className="font-medium text-text-main line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-primary font-semibold mt-1">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          −
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          className="ml-auto text-destructive"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Tạm tính:</span>
                  <span className="font-medium">{formatPrice(totalPrice.toString())}</span>
                </div>
                {shippingEstimate && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Phí ship (ước tính):</span>
                    <span className="font-medium text-primary">
                      {formatPrice(shippingEstimate.toString())}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(totalWithShipping.toString())}
                </span>
              </div>
              <div className="space-y-2">
                <Link 
                  href="/cart" 
                  onClick={() => setIsOpen(false)}
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
                >
                  Xem giỏ hàng
                </Link>
                <Link 
                  href="/checkout" 
                  onClick={() => setIsOpen(false)}
                  className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                >
                  Thanh toán
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

