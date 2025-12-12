/**
 * Apply Coupon Component
 * 
 * Component để apply/remove coupon:
 * - Input coupon code
 * - Apply button
 * - Display current discount
 * - Remove coupon button
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X, Tag } from 'lucide-react';
import { canEditOrder, type OrderStatus } from '@/lib/utils/orderStateMachine';

interface ApplyCouponProps {
  orderId: string;
  orderStatus: OrderStatus;
  discountTotal: number;
  couponCode?: string;
  onCouponChange: () => void; // Callback to refresh order data
}

export function ApplyCoupon({
  orderId,
  orderStatus,
  discountTotal,
  couponCode,
  onCouponChange,
}: ApplyCouponProps) {
  const [couponInput, setCouponInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = canEditOrder(orderStatus);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setError('Vui lòng nhập mã giảm giá');
      return;
    }

    if (!canEdit) {
      alert('Đơn hàng không thể chỉnh sửa ở trạng thái này');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/coupon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          couponCode: couponInput.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Mã giảm giá không hợp lệ');
        return;
      }

      onCouponChange();
      setCouponInput('');
    } catch (error) {
      console.error('Error applying coupon:', error);
      setError('Có lỗi xảy ra khi áp dụng mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!canEdit) {
      alert('Đơn hàng không thể chỉnh sửa ở trạng thái này');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/coupon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Có lỗi xảy ra');
        return;
      }

      onCouponChange();
    } catch (error) {
      console.error('Error removing coupon:', error);
      setError('Có lỗi xảy ra khi xóa mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Mã giảm giá
          </CardTitle>
        </CardHeader>
        <CardContent>
          {couponCode ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mã giảm giá:</span>
                <span className="font-mono text-sm">{couponCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Giảm giá:</span>
                <span className="font-semibold text-green-600">
                  -{new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(discountTotal)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Chưa có mã giảm giá</div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Mã giảm giá
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {couponCode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <span className="text-sm font-medium">Mã giảm giá:</span>
                <span className="ml-2 font-mono text-sm">{couponCode}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Xóa
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Giảm giá:</span>
              <span className="font-semibold text-green-600">
                -{new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(discountTotal)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Nhập mã giảm giá</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon-code"
                  placeholder="Nhập mã giảm giá..."
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyCoupon();
                    }
                  }}
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponInput.trim()}
                  className="min-h-[44px]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Áp dụng'
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

