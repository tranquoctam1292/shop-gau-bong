'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateVietQR, formatAmountForVietQR, formatAddInfoForVietQR } from '@/lib/services/vietqr';

interface VietQRPaymentProps {
  orderId: string | number;
  amount: number; // Amount in VND
  accountNo: string;
  accountName: string;
  acqId: string; // Bank code
  onPaymentVerified?: () => void;
}

export function VietQRPayment({
  orderId,
  amount,
  accountNo,
  accountName,
  acqId,
  onPaymentVerified,
}: VietQRPaymentProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadQRCode = async () => {
      try {
        setIsLoading(true);
        const url = await generateVietQR({
          accountNo,
          accountName,
          acqId,
          template: 'compact',
          amount: formatAmountForVietQR(amount),
          addInfo: formatAddInfoForVietQR(orderId),
        });
        setQrCodeUrl(url);
      } catch (err: any) {
        setError(err.message || 'Không thể tạo QR code');
      } finally {
        setIsLoading(false);
      }
    };

    loadQRCode();
  }, [orderId, amount, accountNo, accountName, acqId]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paymentContent = formatAddInfoForVietQR(orderId);

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-heading text-xl font-semibold mb-2">
          Thanh toán qua VietQR
        </h3>
        <p className="text-sm text-text-muted">
          Quét QR code bằng ứng dụng ngân hàng để thanh toán
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-text-muted">Đang tạo QR code...</div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {qrCodeUrl && !isLoading && (
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64 bg-white p-4 rounded-lg border-2 border-primary">
              <Image
                src={qrCodeUrl}
                alt="VietQR Payment QR Code"
                fill
                className="object-contain"
                sizes="256px"
              />
            </div>
          </div>

          {/* Payment Info */}
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
              <span className="text-text-muted">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{accountNo}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAccount}
                  className="h-8 px-2 text-xs"
                >
                  {copied ? 'Đã copy' : 'Copy'}
                </Button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Chủ tài khoản:</span>
              <span className="font-medium">{accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Nội dung:</span>
              <span className="font-medium">{paymentContent}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">Hướng dẫn thanh toán:</p>
            <ol className="list-decimal list-inside space-y-1 text-text-muted">
              <li>Mở ứng dụng ngân hàng trên điện thoại</li>
              <li>Chọn tính năng &quot;Quét QR&quot; hoặc &quot;Chuyển khoản&quot;</li>
              <li>Quét QR code ở trên hoặc nhập thông tin tài khoản</li>
              <li>Kiểm tra số tiền và nội dung chuyển khoản</li>
              <li>Xác nhận thanh toán</li>
              <li>Đơn hàng sẽ được cập nhật tự động sau vài phút</li>
            </ol>
          </div>

          {/* Manual Check Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onPaymentVerified}
          >
            Tôi đã thanh toán xong
          </Button>
        </div>
      )}
    </Card>
  );
}
