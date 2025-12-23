'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { useCartStore, type CartItem } from '@/lib/store/cartStore';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useShippingEstimate } from '@/lib/hooks/useShippingEstimate';
import { formatPrice } from '@/lib/utils/format';
import { EmptyCartState } from '@/components/ui/empty-state';

export default function CartPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { updateCartItem, removeFromCart } = useCartSync();
  const { shippingWeight, shippingEstimate } = useShippingEstimate();
  const totalPrice = getTotalPrice();
  const totalWithShipping = totalPrice + (shippingEstimate || 0);

  if (items.length === 0) {
    return (
      <div className="container-mobile py-8 md:py-16">
        <h1 className="font-heading text-2xl md:text-3xl mb-6">
          Giỏ hàng
        </h1>
        <EmptyCartState />
      </div>
    );
  }

  return (
    <div className="container-mobile py-8 md:py-16">
      <h1 className="font-heading text-2xl md:text-3xl mb-6">
        Giỏ hàng ({items.length} sản phẩm)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: CartItem) => (
            <Card key={item.productId} className="p-4">
              <div className="flex gap-4">
                <Link
                  href={`/products/${item.productId}`}
                  className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden"
                >
                  <Image
                    src={item.image || '/images/teddy-placeholder.png'}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-heading text-lg font-semibold text-text-main hover:text-primary"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-primary font-semibold mt-1">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartItem(item.productId, item.quantity - 1, item.variationId);
                      }}
                      className="h-10 w-10 p-0 min-h-[44px] min-w-[44px] touch-manipulation"
                      aria-label="Giảm số lượng"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </Button>
                    <span className="w-12 text-center font-medium min-w-[44px]">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartItem(item.productId, item.quantity + 1, item.variationId);
                      }}
                      className="h-10 w-10 p-0 min-h-[44px] min-w-[44px] touch-manipulation"
                      aria-label="Tăng số lượng"
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.productId, item.variationId);
                      }}
                      className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] px-4 touch-manipulation"
                      aria-label="Xóa sản phẩm"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={clearCart}
            className="w-full md:w-auto"
          >
            Xóa tất cả
          </Button>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="font-heading text-xl font-semibold mb-4">
              Tóm tắt đơn hàng
            </h2>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Tạm tính:</span>
                <span className="font-medium">{formatPrice(totalPrice.toString())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Cân nặng vận chuyển:</span>
                <span className="font-medium">{shippingWeight.toFixed(2)} kg</span>
              </div>
              {shippingEstimate && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Phí ship (ước tính):</span>
                  <span className="font-medium text-primary">
                    {formatPrice(shippingEstimate.toString())}
                  </span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Tổng cộng:</span>
                <span className="text-primary text-lg">
                  {formatPrice(totalWithShipping.toString())}
                </span>
              </div>
              {shippingEstimate && (
                <p className="text-xs text-text-muted italic">
                  * Phí ship ước tính, phí chính xác sẽ được tính khi nhập địa chỉ giao hàng
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Link 
                href="/checkout" 
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
                Thanh toán
              </Link>
              <Link 
                href="/products" 
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
                Tiếp tục mua sắm
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


