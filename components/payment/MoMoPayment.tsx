'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// MoMo payment handled via API route (server-side)

interface MoMoPaymentProps {
  orderId: string | number;
  amount: number; // Amount in VND
  returnUrl: string;
  notifyUrl: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export function MoMoPayment({
  orderId,
  amount,
  returnUrl,
  notifyUrl,
  onPaymentSuccess,
  onPaymentError,
}: MoMoPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call server-side API to create payment request
      const response = await fetch('/api/payment/momo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId.toString(),
          amount,
          returnUrl,
          notifyUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo yêu cầu thanh toán');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Không thể tạo yêu cầu thanh toán');
      }

      // Redirect to MoMo payment page
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else if (data.deeplink) {
        // Try to open MoMo app, fallback to web
        window.location.href = data.deeplink;
      } else if (data.qrCodeUrl) {
        // Show QR code if available
        setPaymentUrl(data.qrCodeUrl);
      } else {
        throw new Error('Không nhận được URL thanh toán từ MoMo');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Có lỗi xảy ra khi tạo yêu cầu thanh toán';
      setError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-heading text-xl font-semibold mb-2">
          Thanh toán qua MoMo
        </h3>
        <p className="text-sm text-text-muted">
          Thanh toán nhanh chóng và an toàn qua ví điện tử MoMo
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Số tiền:</span>
          <span className="font-semibold text-primary">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(amount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Mã đơn hàng:</span>
          <span className="font-medium">#{orderId}</span>
        </div>
      </div>

      {paymentUrl && (
        <div className="text-center">
          <p className="text-sm text-text-muted mb-2">Quét QR code để thanh toán:</p>
          <div className="relative w-full max-w-xs mx-auto aspect-square">
            <Image
              src={paymentUrl}
              alt="MoMo QR Code"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        className="w-full"
        size="lg"
        onClick={handlePayment}
        disabled={isLoading}
      >
        {isLoading ? 'Đang xử lý...' : 'Thanh toán qua MoMo'}
      </Button>

      <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
        <p className="font-semibold">Lưu ý:</p>
        <ul className="list-disc list-inside space-y-1 text-text-muted">
          <li>Bạn sẽ được chuyển đến trang thanh toán MoMo</li>
          <li>Vui lòng xác nhận thanh toán trong ứng dụng MoMo</li>
          <li>Sau khi thanh toán thành công, bạn sẽ được chuyển về trang xác nhận</li>
        </ul>
      </div>
    </Card>
  );
}

