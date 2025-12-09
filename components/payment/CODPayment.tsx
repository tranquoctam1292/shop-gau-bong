'use client';

import { Card } from '@/components/ui/card';

interface CODPaymentProps {
  orderId: string;
  amount: number;
}

/**
 * COD Payment Component
 * Hiển thị thông tin thanh toán khi nhận hàng
 */
export function CODPayment({ orderId, amount }: CODPaymentProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="text-center">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="font-heading text-xl font-semibold mb-2">
          Thanh toán khi nhận hàng (COD)
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Đơn hàng của bạn đã được xác nhận. Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Mã đơn hàng:</span>
          <span className="font-medium">#{orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Số tiền cần thanh toán:</span>
          <span className="font-semibold text-primary">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(amount)}
          </span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Lưu ý:</strong> Vui lòng chuẩn bị đúng số tiền khi nhận hàng. 
          Nhân viên giao hàng sẽ thu tiền và cung cấp hóa đơn cho bạn.
        </p>
      </div>

      <div className="text-xs text-text-muted space-y-1">
        <p>• Đơn hàng sẽ được xử lý trong 1-2 ngày làm việc</p>
        <p>• Bạn sẽ nhận được thông báo khi đơn hàng được giao</p>
        <p>• Nếu có thắc mắc, vui lòng liên hệ hotline: [Số điện thoại]</p>
      </div>
    </Card>
  );
}


