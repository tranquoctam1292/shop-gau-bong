'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Card } from '@/components/ui/card';
import { VietQRPayment } from '@/components/payment/VietQRPayment';
import { MoMoPayment } from '@/components/payment/MoMoPayment';
import { CODPayment } from '@/components/payment/CODPayment';
import { BankTransferPayment } from '@/components/payment/BankTransferPayment';
import { useOrderREST } from '@/lib/hooks/useOrderREST';
import { formatPrice } from '@/lib/utils/format';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentMethodFromUrl = searchParams.get('paymentMethod');

  // Fetch order details from REST API
  const { order, loading, error } = useOrderREST(orderId);
  const paymentMethod = paymentMethodFromUrl || order?.payment_method || 'bacs';

  if (loading) {
    return (
      <div className="container-mobile py-8 md:py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </div>
    );
  }

  if (error || !order || !order.id) {
    return (
      <div className="container-mobile py-8 md:py-16 text-center">
        <Card className="p-6 bg-destructive/10 text-destructive max-w-md mx-auto">
          <h1 className="font-heading text-2xl md:text-3xl mb-4">
            Không tìm thấy đơn hàng
          </h1>
          <p className="mb-4">
            {error ? `Có lỗi xảy ra: ${error.message}` : 'Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className={buttonVariants({ variant: 'outline' })}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-mobile py-8 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="font-heading text-2xl md:text-3xl mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-text-muted mb-6">
            Cảm ơn bạn đã đặt hàng. Chúng tôi đã nhận được đơn hàng của bạn và sẽ xử lý sớm nhất có thể.
          </p>

          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-text-muted mb-1">Mã đơn hàng</p>
            <p className="font-heading text-xl font-bold">
              #{order.number || order.id}
            </p>
            {order.total && (
              <p className="text-sm text-text-muted mt-2">
                Tổng tiền: <span className="font-semibold text-primary">{formatPrice(order.total)}</span>
              </p>
            )}
          </div>

          {/* Payment Methods */}
          <div className="mb-6 space-y-4">
            {/* VietQR Payment - Show if payment method is 'bacs' */}
            {paymentMethod === 'bacs' && (
              <VietQRPayment
                orderId={order.number?.toString() || order.id.toString()}
                amount={parseFloat(order.total || '0')}
                accountNo={process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || '1234567890'}
                accountName={process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || 'SHOP GAU BONG'}
                acqId={process.env.NEXT_PUBLIC_VIETQR_ACQ_ID || '970415'}
                onPaymentVerified={() => {
                  // TODO: Refresh order status
                  alert('Cảm ơn bạn đã thanh toán! Đơn hàng sẽ được cập nhật trong vài phút.');
                }}
              />
            )}

            {/* MoMo Payment - Show if payment method is 'momo' */}
            {paymentMethod === 'momo' && typeof window !== 'undefined' && (
              <MoMoPayment
                orderId={order.number?.toString() || order.id.toString()}
                amount={parseFloat(order.total || '0')}
                returnUrl={`${window.location.origin}/order-confirmation?orderId=${order.id}&paymentMethod=momo&status=success`}
                notifyUrl={`${window.location.origin}/api/payment/webhook/momo`}
                onPaymentSuccess={() => {
                  // Payment will redirect automatically
                }}
                onPaymentError={(error) => {
                  alert(`Lỗi thanh toán: ${error}`);
                }}
              />
            )}

            {/* COD Payment - Show if payment method is 'cod' */}
            {paymentMethod === 'cod' && (
              <CODPayment
                orderId={order.number?.toString() || order.id.toString()}
                amount={parseFloat(order.total || '0')}
              />
            )}

            {/* Bank Transfer Payment - Show if payment method is 'bank_transfer' */}
            {paymentMethod === 'bank_transfer' && (
              <BankTransferPayment
                orderId={order.number?.toString() || order.id.toString()}
                amount={parseFloat(order.total || '0')}
              />
            )}
          </div>

          <div className="space-y-3 text-left mb-6">
            <p className="text-sm">
              <span className="font-medium">Bước tiếp theo:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-text-muted ml-4">
              {paymentMethod === 'bacs' && (
                <li>Vui lòng thanh toán qua QR code ở trên để hoàn tất đơn hàng</li>
              )}
              {paymentMethod === 'cod' && (
                <li>Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng</li>
              )}
              <li>Chúng tôi sẽ gửi email xác nhận đến địa chỉ email của bạn</li>
              <li>Đơn hàng sẽ được xử lý trong vòng 1-2 ngày làm việc</li>
              <li>Bạn sẽ nhận được thông báo khi đơn hàng được giao</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className={buttonVariants()}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container-mobile py-8 md:py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}

