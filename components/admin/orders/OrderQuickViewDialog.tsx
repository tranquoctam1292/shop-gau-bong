/**
 * Order Quick View Dialog
 * 
 * Lightweight dialog/sheet to quickly view order information without navigating to detail page
 * - Desktop: Dialog component
 * - Mobile: Sheet component (drawer from bottom)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// Hook to detect mobile vs desktop
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, X, User, Mail, Phone, MapPin } from 'lucide-react';
import { getStatusLabel, getStatusColor, type OrderStatus } from '@/lib/utils/orderStateMachine';
import { useToastContext } from '@/components/providers/ToastProvider';
import type { OrderQuickView } from '@/types/order';

interface OrderQuickViewDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderQuickViewDialog({
  orderId,
  open,
  onOpenChange,
}: OrderQuickViewDialogProps) {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [order, setOrder] = useState<OrderQuickView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Fetch order data function (extracted for reuse)
  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/quick-view`, {
        credentials: 'include',
      });

      // Check response status and content-type (follow pattern from ProductQuickEditDialog)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Đơn hàng không tồn tại');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      if (data.order) {
        setOrder(data.order);
      } else {
        throw new Error('Không tìm thấy dữ liệu đơn hàng');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải đơn hàng';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  // Fetch order data when dialog opens
  useEffect(() => {
    if (open && orderId) {
      fetchOrder();
    }
  }, [open, orderId, fetchOrder]);

  // Auto-close dialog after 3s if error (optional feature from plan)
  useEffect(() => {
    if (error && open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, open, onOpenChange]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setOrder(null);
      setError(null);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleViewDetail = () => {
    if (order) {
      router.push(`/admin/orders/${order._id}`);
      handleClose();
    }
  };

  // Format currency VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date with error handling
  const formatDate = (date: string | Date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Ngày không hợp lệ';
      }
      return dateObj.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Ngày không hợp lệ';
    }
  };

  // Format shipping address
  const formatAddress = (order: OrderQuickView) => {
    const address = order.shippingAddress || order.shipping;
    if (!address) return 'Chưa có địa chỉ';

    const parts: string[] = [];
    if (address.address1) parts.push(address.address1);
    if (address.address2) parts.push(address.address2);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.province) parts.push(address.province);

    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
  };

  // Content component (shared between Dialog and Sheet)
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-sm text-muted-foreground">Đang tải đơn hàng...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <X className="h-12 w-12 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <p className="text-xs text-muted-foreground">Dialog sẽ tự động đóng sau 3 giây</p>
          <Button variant="outline" onClick={fetchOrder} className="min-h-[44px]">
            Thử lại
          </Button>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Order Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mã đơn:</span>
              <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trạng thái:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                  order.status as OrderStatus
                )}`}
              >
                {getStatusLabel(order.status as OrderStatus)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Thanh toán:</span>
              <span className="text-sm font-medium">
                {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                 order.paymentStatus === 'pending' ? 'Chờ thanh toán' :
                 order.paymentStatus === 'failed' ? 'Thất bại' : 'Đã hoàn tiền'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phương thức:</span>
              <span className="text-sm font-medium">
                {order.paymentMethod === 'cod' ? 'COD' :
                 order.paymentMethod === 'vietqr' ? 'VietQR' :
                 order.paymentMethod === 'momo' ? 'MoMo' : 'Chuyển khoản'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ngày tạo:</span>
              <span className="text-sm">{formatDate(order.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{order.customerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm break-all">{order.customerEmail}</p>
              </div>
            </div>
            {order.customerPhone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm">{order.customerPhone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Address Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Địa chỉ giao hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">{formatAddress(order)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item._id} className="flex items-start justify-between gap-4 pb-3 border-b last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.productName}</p>
                    {item.variant && (item.variant.size || item.variant.color) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[item.variant.size, item.variant.color].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      SL: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Totals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tổng tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tạm tính:</span>
              <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.shippingTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Phí vận chuyển:</span>
                <span className="text-sm font-medium">{formatCurrency(order.shippingTotal)}</span>
              </div>
            )}
            {order.taxTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Thuế:</span>
                <span className="text-sm font-medium">{formatCurrency(order.taxTotal)}</span>
              </div>
            )}
            {order.discountTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Giảm giá:</span>
                <span className="text-sm font-medium text-green-600">
                  -{formatCurrency(order.discountTotal)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-base font-semibold">Tổng cộng:</span>
              <span className="text-base font-bold">{formatCurrency(order.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Only render one component based on screen size to prevent duplicate dialogs
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-2xl overflow-hidden flex flex-col p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
            <SheetTitle className="text-lg font-semibold">Xem nhanh đơn hàng</SheetTitle>
            <SheetDescription className="sr-only">
              Xem thông tin chi tiết đơn hàng bao gồm thông tin khách hàng, địa chỉ giao hàng, sản phẩm và tổng tiền
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {renderContent()}
          </div>
          {order && !loading && !error && (
            <SheetFooter className="px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="min-h-[44px] flex-1"
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={handleViewDetail}
                className="min-h-[44px] flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem chi tiết
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Xem nhanh đơn hàng</DialogTitle>
          <DialogDescription className="sr-only">
            Xem thông tin chi tiết đơn hàng bao gồm thông tin khách hàng, địa chỉ giao hàng, sản phẩm và tổng tiền
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderContent()}
        </div>
        {order && !loading && !error && (
          <DialogFooter className="px-6 py-4 border-t border-slate-200 flex-shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="min-h-[44px]"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleViewDetail}
              className="min-h-[44px]"
            >
              <Eye className="w-4 h-4 mr-2" />
              Xem chi tiết
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

