'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToastContext } from '@/components/providers/ToastProvider';

interface BankTransferPaymentProps {
  orderId: string;
  amount: number;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

/**
 * Bank Transfer Payment Component
 * Hiển thị thông tin tài khoản ngân hàng và form upload receipt
 */
export function BankTransferPayment({
  orderId,
  amount,
  bankInfo,
}: BankTransferPaymentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Toast context (optional)
  let showToast: ((message: string, type?: 'info' | 'warning' | 'error' | 'success') => void) | null = null;
  try {
    const toastContext = useToastContext();
    showToast = toastContext.showToast;
  } catch {
    // ToastProvider chưa được wrap
  }

  // Default bank info (có thể lấy từ env hoặc Global Options)
  const defaultBankInfo = {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'Ngân hàng',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '1234567890',
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'SHOP GAU BONG',
  };

  const finalBankInfo = bankInfo || defaultBankInfo;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showToast?.('Chỉ chấp nhận file ảnh (JPG, PNG) hoặc PDF', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast?.('File không được vượt quá 5MB', 'error');
        return;
      }

      setSelectedFile(file);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast?.('Vui lòng chọn file ảnh chứng từ', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('orderId', orderId);
      formData.append('amount', amount.toString());

      const response = await fetch('/api/payment/bank-transfer/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Không thể upload file');
      }

      const data = await response.json();
      if (data.success) {
        setUploadSuccess(true);
        showToast?.('Đã upload ảnh chứng từ thành công. Shop sẽ xác nhận thanh toán trong 1-2 ngày làm việc.', 'success');
      } else {
        throw new Error(data.error || 'Upload thất bại');
      }
    } catch (error: any) {
      showToast?.(error.message || 'Có lỗi xảy ra khi upload file. Vui lòng thử lại.', 'error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(finalBankInfo.accountNumber);
    showToast?.('Đã sao chép số tài khoản', 'success');
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🏦</div>
        <h3 className="font-heading text-xl font-semibold mb-2">
          Chuyển khoản ngân hàng
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Vui lòng chuyển khoản đúng số tiền và upload ảnh chứng từ để shop xác nhận thanh toán.
        </p>
      </div>

      {/* Bank Info */}
      <div className="bg-muted p-4 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Ngân hàng:</span>
          <span className="font-semibold">{finalBankInfo.bankName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Số tài khoản:</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold font-mono">{finalBankInfo.accountNumber}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAccountNumber}
              className="h-8 px-2"
            >
              📋
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Chủ tài khoản:</span>
          <span className="font-semibold">{finalBankInfo.accountName}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-text-muted">Số tiền cần chuyển:</span>
          <span className="font-semibold text-primary text-lg">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(amount)}
          </span>
        </div>
      </div>

      {/* Upload Receipt */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            Upload ảnh chứng từ chuyển khoản *
          </label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="flex-1"
              disabled={isUploading || uploadSuccess}
            />
            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={isUploading || uploadSuccess}
                className="min-w-[120px]"
              >
                {isUploading ? 'Đang upload...' : uploadSuccess ? '✓ Đã upload' : 'Upload'}
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="text-xs text-text-muted mt-1">
              File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Đã upload thành công! Shop sẽ xác nhận thanh toán trong 1-2 ngày làm việc.
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-sm text-yellow-800 font-medium mb-2">Lưu ý quan trọng:</p>
        <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
          <li>Chuyển khoản đúng số tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</li>
          <li>Nội dung chuyển khoản: Đơn hàng #{orderId}</li>
          <li>Upload ảnh chứng từ rõ ràng (screenshot hoặc ảnh chụp biên lai)</li>
          <li>Shop sẽ xác nhận thanh toán trong 1-2 ngày làm việc sau khi nhận được chứng từ</li>
        </ul>
      </div>

      {/* Info */}
      <div className="text-xs text-text-muted space-y-1">
        <p>• Đơn hàng sẽ được xử lý sau khi shop xác nhận thanh toán</p>
        <p>• Bạn sẽ nhận được email thông báo khi thanh toán được xác nhận</p>
        <p>• Nếu có thắc mắc, vui lòng liên hệ hotline: [Số điện thoại]</p>
      </div>
    </Card>
  );
}


