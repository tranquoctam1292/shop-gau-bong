'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useQuickCheckoutStore } from '@/lib/store/useQuickCheckoutStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { useCheckoutREST, type CheckoutFormData } from '@/lib/hooks/useCheckoutREST';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OrderSummarySection } from './OrderSummarySection';
import { CheckoutFormSection } from './CheckoutFormSection';
import { cn } from '@/lib/utils/cn';

export function QuickCheckoutModal() {
  const { isOpen, onClose } = useQuickCheckoutStore();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { updateCartItem, removeFromCart } = useCartSync();
  const { submitOrder } = useCheckoutREST();
  const router = useRouter();

  // Debug: Log state changes (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[QuickCheckoutModal] State:', { isOpen, itemsCount: items.length });
    }
  }, [isOpen, items.length]);

  // Form state
  const [fullName, setFullName] = useState('');
  const [formData, setFormData] = useState<Partial<CheckoutFormData>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    billingAddress1: '',
    billingCity: '',
    billingPostcode: '',
    billingCountry: 'VN',
    customerNote: '',
    paymentMethod: 'cod',
    shippingMethod: undefined,
  });

  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [freeGiftWrap, setFreeGiftWrap] = useState(true);
  const [paidGiftWrap, setPaidGiftWrap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPrice = getTotalPrice();
  const discount = 0; // TODO: Calculate from voucher
  const finalTotal = totalPrice - discount;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFullName('');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        billingAddress1: '',
        billingCity: '',
        billingPostcode: '',
        billingCountry: 'VN',
        customerNote: '',
        paymentMethod: 'cod',
      });
      setIsGift(false);
      setRecipientName('');
      setRecipientPhone('');
      setFreeGiftWrap(true);
      setPaidGiftWrap(false);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[1-9][0-9]{8,9}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!formData.billingAddress1?.trim()) {
      newErrors.billingAddress1 = 'Vui lòng nhập địa chỉ';
    }

    // Validate recipient fields if gift is enabled
    if (isGift) {
      if (!recipientName.trim()) {
        newErrors.recipientName = 'Vui lòng nhập tên người nhận';
      }
      if (!recipientPhone.trim()) {
        newErrors.recipientPhone = 'Vui lòng nhập số điện thoại người nhận';
      } else if (!/^(0|\+84)[1-9][0-9]{8,9}$/.test(recipientPhone.replace(/[\s-]/g, ''))) {
        newErrors.recipientPhone = 'Số điện thoại người nhận không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (items.length === 0) {
      setErrors({ general: 'Giỏ hàng trống' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Tách họ và tên từ fullName (lấy từ đầu đến khoảng trắng cuối cùng là họ, phần còn lại là tên)
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName.trim();
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      // Generate email từ phone nếu cần (hoặc để trống)
      const email = formData.phone ? `${formData.phone.replace(/[\s-]/g, '')}@shop-gaubong.com` : '';

      const checkoutData: CheckoutFormData = {
        firstName: firstName || fullName.trim(),
        lastName: lastName,
        email: email,
        phone: formData.phone!,
        billingAddress1: formData.billingAddress1!,
        billingAddress2: formData.billingAddress2,
        billingCity: formData.billingCity || '',
        billingPostcode: formData.billingPostcode || '',
        billingCountry: formData.billingCountry || 'VN',
        paymentMethod: formData.paymentMethod || 'cod',
        shippingMethod: formData.shippingMethod,
        customerNote: formData.customerNote || (isGift ? 'Đơn hàng quà tặng' : ''),
      };

      // Calculate totals
      const subtotal = totalPrice;
      const shippingTotal = 0; // TODO: Calculate shipping cost if needed
      const total = subtotal + shippingTotal;

      const result = await submitOrder(checkoutData, items, subtotal, shippingTotal, total);
      
      if (result) {
        // Clear cart after successful order
        clearCart();
        
        // Close modal and redirect to success page
        onClose();
        router.push(`/order-confirmation?orderId=${result.orderId}&paymentMethod=${checkoutData.paymentMethod}&total=${totalPrice}`);
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt hàng' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 sm:rounded-lg flex flex-col">
        {/* Header với gạch ngang ngăn cách */}
        <div className="px-4 md:px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="font-heading text-xl font-bold text-text-main">
            Thanh toán đơn hàng
          </DialogTitle>
          <DialogDescription className="sr-only">
            Điền thông tin thanh toán và đặt hàng
          </DialogDescription>
        </div>

        {/* Content - Scrollable on mobile, independent scroll on desktop */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty State - Hiển thị khi giỏ hàng trống */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center min-h-[400px]">
              <div className="relative bg-pink-50 text-pink-600 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10" strokeWidth={2} />
              </div>
              <h3 className="font-heading text-xl font-semibold text-text-main mb-2">
                Giỏ hàng trống
              </h3>
              <p className="text-text-muted mb-6">
                Bạn chưa có sản phẩm nào trong giỏ hàng
              </p>
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6"
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] h-full">
              {/* CỘT TRÁI - Danh sách sản phẩm (40%) */}
              {/* Mobile: No overflow, Desktop: Independent scroll */}
              <OrderSummarySection
                items={items}
                onUpdateQuantity={updateCartItem}
                onRemoveItem={removeFromCart}
                className={cn(
                  // Mobile: No overflow (parent handles scrolling)
                  'lg:overflow-y-auto',
                  // Desktop: Independent scroll with max height
                  'lg:max-h-[calc(90vh-80px)]'
                )}
              />

              {/* CỘT PHẢI - Form thanh toán (60%) */}
              {/* Mobile: No overflow, Desktop: Independent scroll */}
              <CheckoutFormSection
                fullName={fullName}
                onFullNameChange={setFullName}
                formData={formData}
                onFormDataChange={setFormData}
                errors={errors}
                isGift={isGift}
                onGiftChange={setIsGift}
                recipientName={recipientName}
                onRecipientNameChange={setRecipientName}
                recipientPhone={recipientPhone}
                onRecipientPhoneChange={setRecipientPhone}
                freeGiftWrap={freeGiftWrap}
                onFreeGiftWrapChange={setFreeGiftWrap}
                paidGiftWrap={paidGiftWrap}
                onPaidGiftWrapChange={setPaidGiftWrap}
                totalPrice={totalPrice}
                discount={discount}
                finalTotal={finalTotal}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                className={cn(
                  // Mobile: No overflow (parent handles scrolling)
                  'lg:overflow-y-auto',
                  // Desktop: Independent scroll with max height
                  'lg:max-h-[calc(90vh-80px)]'
                )}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
