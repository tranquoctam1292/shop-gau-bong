'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils/cn';
import { useCartStore } from '@/lib/store/cartStore';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useShippingEstimate } from '@/lib/hooks/useShippingEstimate';
import { formatPrice } from '@/lib/utils/format';
import { SheetTrigger, SheetClose } from '@/components/ui/sheet';

/**
 * Cart Drawer Component
 * 
 * Sử dụng Shadcn Sheet component để đảm bảo:
 * - ✅ Hiển thị chuẩn 100%: Luôn nằm trên cùng (z-index cao nhất), không bị đè
 * - ✅ Trải nghiệm mượt mà: Có animation trượt ra/vào giống Mobile Menu
 * - ✅ Code gọn gàng: Loại bỏ các logic xử lý sự kiện click outside thủ công
 * - ✅ Portal rendering: Tự động render ra ngoài Header (không bị stacking context issues)
 */
export function CartDrawer() {
  // Xử lý Hydration: Đảm bảo đồng bộ giữa Server và Client
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Cart Button - Render trong Header, trigger mở Sheet */}
      {/* Tối ưu giao diện: Ghost variant (trong suốt) để hòa hợp với Header, chỉ hiện nền hồng khi Hover */}
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative rounded-full w-10 h-10 p-0',
            'text-gray-600 hover:text-pink-600',
            'hover:bg-pink-50 transition-colors duration-200',
            'border-0' // Không có border để trong suốt
          )}
          aria-label="Giỏ hàng"
        >
          <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />
          
          {/* Badge - Chỉ hiển thị sau khi mounted để tránh hydration error */}
          {mounted && totalItems > 0 && (
            <span 
              className={cn(
                'absolute -top-1 -right-1',
                'h-5 w-5 rounded-full bg-red-500 text-white',
                'text-[10px] flex items-center justify-center font-bold',
                'border-2 border-white'
              )}
            >
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      {/* Sheet Content - Tự động render ra ngoài Header bằng Portal */}
      <SheetContent 
        side="right" 
        className="w-full sm:w-96 flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="font-heading text-xl font-semibold">
            Giỏ hàng ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="relative bg-pink-50 text-pink-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8" strokeWidth={2} />
              </div>
              <p className="text-text-muted mb-4">Giỏ hàng trống</p>
              <SheetClose asChild>
                <Link 
                  href="/products" 
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
                >
                  Xem sản phẩm
                </Link>
              </SheetClose>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.productId} className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    <Image
                      src={item.image || '/images/teddy-placeholder.png'}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetClose asChild>
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-medium text-text-main line-clamp-2 hover:text-primary transition-colors"
                      >
                        {item.productName}
                      </Link>
                    </SheetClose>
                    <p className="text-primary font-semibold mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                        className="h-10 w-10 p-0 min-h-[44px] min-w-[44px] touch-manipulation"
                        aria-label="Giảm số lượng"
                      >
                        −
                      </Button>
                      <span className="w-10 text-center font-medium min-w-[44px]">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                        className="h-10 w-10 p-0 min-h-[44px] min-w-[44px] touch-manipulation"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                        className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] px-4 touch-manipulation"
                        aria-label="Xóa sản phẩm"
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

        {/* Footer - Fixed at bottom */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4 bg-background">
            <div className="flex flex-col gap-2 text-sm">
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
            <div className="flex flex-col gap-2">
              <SheetClose asChild>
                <Link 
                  href="/cart" 
                  className={cn(
                    buttonVariants({ size: 'lg' }), 
                    'w-full',
                    // Override inline-flex thành flex để hoạt động tốt với w-full
                    '!flex items-center justify-center',
                    // Tăng padding lớn hơn để button có nền rộng hơn
                    '!px-10 !py-5', // 40px horizontal, 20px vertical
                    'min-h-[56px]', // Chiều cao tối thiểu 56px
                    'text-center' // Căn giữa text
                  )}
                >
                  Xem giỏ hàng
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link 
                  href="/checkout" 
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }), 
                    'w-full',
                    // Override inline-flex thành flex để hoạt động tốt với w-full
                    '!flex items-center justify-center',
                    // Tăng padding lớn hơn để button có nền rộng hơn
                    '!px-10 !py-5', // 40px horizontal, 20px vertical
                    'min-h-[56px]', // Chiều cao tối thiểu 56px
                    'text-center' // Căn giữa text
                  )}
                >
                  Thanh toán
                </Link>
              </SheetClose>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
