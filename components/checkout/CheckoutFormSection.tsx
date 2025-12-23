'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { ShoppingCart, Gift, Package } from 'lucide-react';
import type { CheckoutFormData } from '@/lib/hooks/useCheckoutREST';

interface CheckoutFormSectionProps {
  fullName: string;
  onFullNameChange: (value: string) => void;
  formData: Partial<CheckoutFormData>;
  onFormDataChange: (data: Partial<CheckoutFormData>) => void;
  errors: Record<string, string>;
  isGift: boolean;
  onGiftChange: (value: boolean) => void;
  recipientName: string;
  onRecipientNameChange: (value: string) => void;
  recipientPhone: string;
  onRecipientPhoneChange: (value: string) => void;
  freeGiftWrap: boolean;
  onFreeGiftWrapChange: (value: boolean) => void;
  paidGiftWrap: boolean;
  onPaidGiftWrapChange: (value: boolean) => void;
  totalPrice: number;
  discount: number;
  finalTotal: number;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

/**
 * Checkout Form Section Component
 * 
 * Displays checkout form with customer info, payment method, and order summary
 * Used in QuickCheckoutModal - Right column (70% on desktop)
 */
export function CheckoutFormSection({
  fullName,
  onFullNameChange,
  formData,
  onFormDataChange,
  errors,
  isGift,
  onGiftChange,
  recipientName,
  onRecipientNameChange,
  recipientPhone,
  onRecipientPhoneChange,
  freeGiftWrap,
  onFreeGiftWrapChange,
  paidGiftWrap,
  onPaidGiftWrapChange,
  totalPrice,
  discount,
  finalTotal,
  isSubmitting,
  onSubmit,
  className,
}: CheckoutFormSectionProps) {
  return (
    <div className={cn('bg-background p-4 md:p-6 space-y-4 md:space-y-6', className)}>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Họ và Tên và Số điện thoại - Cùng 1 hàng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Input
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              className={cn(errors.fullName && 'border-destructive')}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive mt-1">{errors.fullName}</p>
            )}
          </div>
          <div>
            <Input
              type="tel"
              placeholder="Số điện thoại"
              value={formData.phone || ''}
              onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
              className={cn(errors.phone && 'border-destructive')}
            />
            {errors.phone && (
              <p className="text-xs text-destructive mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Toggle: Gửi Tặng Quà */}
        <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-sm border border-pink-200">
          <input
            type="checkbox"
            id="isGift"
            checked={isGift}
            onChange={(e) => onGiftChange(e.target.checked)}
            className="w-4 h-4 rounded border-pink-300 text-primary focus:ring-pink-500"
          />
          <label htmlFor="isGift" className="text-sm font-medium text-text-main cursor-pointer flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Gửi Tặng Quà cho người khác?
          </label>
        </div>

        {/* Recipient Information Section - Hiển thị khi isGift = true */}
        {isGift && (
          <div className="border border-destructive rounded-sm p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Tên người nhận *"
                  value={recipientName}
                  onChange={(e) => onRecipientNameChange(e.target.value)}
                  className={cn(errors.recipientName && 'border-destructive')}
                />
                {errors.recipientName && (
                  <p className="text-xs text-destructive mt-1">{errors.recipientName}</p>
                )}
              </div>
              <div>
                <Input
                  type="tel"
                  placeholder="SĐT người nhận *"
                  value={recipientPhone}
                  onChange={(e) => onRecipientPhoneChange(e.target.value)}
                  className={cn(errors.recipientPhone && 'border-destructive')}
                />
                {errors.recipientPhone && (
                  <p className="text-xs text-destructive mt-1">{errors.recipientPhone}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              *Shop sẽ gọi điện / zalo đến người mua trước để xác nhận đơn & gửi STK (Nếu A/c cần thanh toán trước để gửi tặng)
            </p>
          </div>
        )}

        {/* Địa chỉ */}
        <div>
          <Input
            placeholder="Địa chỉ cụ thể (Số nhà, tên đường)"
            value={formData.billingAddress1 || ''}
            onChange={(e) => onFormDataChange({ ...formData, billingAddress1: e.target.value })}
            className={cn(errors.billingAddress1 && 'border-destructive')}
          />
          {errors.billingAddress1 && (
            <p className="text-xs text-destructive mt-1">{errors.billingAddress1}</p>
          )}
        </div>

        {/* Ghi chú */}
        <div>
          <Input
            placeholder="Ghi chú (tùy chọn)"
            value={formData.customerNote || ''}
            onChange={(e) => onFormDataChange({ ...formData, customerNote: e.target.value })}
          />
        </div>

        {/* Dịch vụ kèm theo */}
        <div className="space-y-2">
          <h4 className="font-heading text-sm font-semibold text-text-main">
            Dịch vụ kèm theo:
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-2 rounded-sm hover:bg-pink-50 cursor-pointer">
              <input
                type="checkbox"
                checked={freeGiftWrap}
                onChange={(e) => {
                  onFreeGiftWrapChange(e.target.checked);
                  if (e.target.checked) onPaidGiftWrapChange(false);
                }}
                className="w-4 h-4 rounded border-pink-300 text-primary focus:ring-pink-500"
              />
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm text-text-main">Bọc Quà Miễn phí</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-sm hover:bg-pink-50 cursor-pointer">
              <input
                type="checkbox"
                checked={paidGiftWrap}
                onChange={(e) => {
                  onPaidGiftWrapChange(e.target.checked);
                  if (e.target.checked) onFreeGiftWrapChange(false);
                }}
                className="w-4 h-4 rounded border-pink-300 text-primary focus:ring-pink-500"
              />
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm text-text-main">Bọc Quà Có Phí</span>
            </label>
          </div>
        </div>

        {/* Hình thức thanh toán */}
        <div className="space-y-2">
          <h4 className="font-heading text-sm font-semibold text-text-main">
            Hình thức thanh toán:
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 rounded-sm border-2 border-gray-200 hover:border-pink-300 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="bacs"
                checked={formData.paymentMethod === 'bacs'}
                onChange={(e) => onFormDataChange({ ...formData, paymentMethod: 'bacs' })}
                className="w-4 h-4 border-pink-300 text-primary focus:ring-pink-500"
              />
              <span className="text-sm text-text-main">Chuyển khoản</span>
            </label>
            <label className="flex items-center gap-2 p-3 rounded-sm border-2 border-gray-200 hover:border-pink-300 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={formData.paymentMethod === 'cod'}
                onChange={(e) => onFormDataChange({ ...formData, paymentMethod: 'cod' })}
                className="w-4 h-4 border-pink-300 text-primary focus:ring-pink-500"
              />
              <span className="text-sm text-text-main">COD (Thanh toán khi nhận hàng)</span>
            </label>
          </div>
        </div>

        {/* Error message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Footer - Tổng tiền và nút đặt hàng */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Tạm tính:</span>
            <span className="font-medium">{formatPrice(totalPrice.toString())}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Giảm giá:</span>
              <span className="font-medium text-green-600">-{formatPrice(discount.toString())}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-heading text-lg font-bold text-text-main">Tổng tiền:</span>
            <span className="font-heading text-2xl font-bold text-[#D6336C]">
              {formatPrice(finalTotal.toString())}
            </span>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D6336C] hover:bg-[#BE185D] text-white min-h-[56px] text-base font-bold gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Đặt đơn hàng
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

