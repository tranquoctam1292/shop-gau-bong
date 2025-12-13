'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { OrderTimeline } from '@/components/admin/orders/OrderTimeline';
import { OrderActionBar } from '@/components/admin/orders/OrderActionBar';
import { CustomerInfoCard } from '@/components/admin/orders/CustomerInfoCard';
import { EditOrderItems } from '@/components/admin/orders/EditOrderItems';
import { EditShippingAddress } from '@/components/admin/orders/EditShippingAddress';
import { ApplyCoupon } from '@/components/admin/orders/ApplyCoupon';
import { CreateShipmentModal } from '@/components/admin/orders/CreateShipmentModal';
import { ShipmentInfo } from '@/components/admin/orders/ShipmentInfo';
import { RefundHistory } from '@/components/admin/orders/RefundHistory';
import { PrintShippingLabel } from '@/components/admin/orders/PrintShippingLabel';
import { PrintInvoice } from '@/components/admin/orders/PrintInvoice';
import { getStatusLabel, getStatusColor, type OrderStatus } from '@/lib/utils/orderStateMachine';

interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    address?: string;
    ward?: string;
    district?: string;
    province?: string;
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  shipping?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    district?: string;
    ward?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'awaiting_payment' | 'confirmed' | 'shipping' | 'refunded' | 'failed';
  total: number;
  grandTotal?: number;
  shippingCost?: number;
  shippingTotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  subtotal: number;
  adminNote?: string;
  adminNotes?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface OrderDetailProps {
  orderId: string;
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');
  const [showShipmentModal, setShowShipmentModal] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        const data = await response.json();
        if (data.order) {
          const orderData = data.order as Order;
          setOrder(orderData);
          setStatus(orderData.status);
          setPaymentStatus(orderData.paymentStatus);
          setAdminNote(orderData.adminNote || '');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          adminNote,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      const data = await response.json();
      setOrder(data.order);
      await refreshOrder(); // Refresh to get latest data
      alert('Cập nhật đơn hàng thành công');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Có lỗi xảy ra khi cập nhật đơn hàng');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy đơn hàng</p>
        <Link href="/admin/orders">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  const refreshOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();
      if (data.order) {
        const orderData = data.order as Order;
        setOrder(orderData);
        setStatus(orderData.status);
        setPaymentStatus(orderData.paymentStatus);
        setAdminNote(orderData.adminNote || '');
      }
    } catch (error) {
      console.error('Error refreshing order:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* 3-Column Layout: Left (large), Right (small), Bottom (full width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items - Editable */}
          <EditOrderItems
            orderId={order._id}
            orderStatus={order.status as OrderStatus}
            items={order.items}
            onItemsChange={refreshOrder}
          />

          {/* Order Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(order.subtotal)}
                  </span>
                </div>
                {(order.discountTotal ?? 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>
                      -{new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(order.discountTotal ?? 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(order.shippingCost || 0)}
                  </span>
                </div>
                {(order.taxTotal ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Thuế:</span>
                    <span>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(order.taxTotal ?? 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(order.grandTotal || order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <OrderActionBar
                orderId={order._id}
                orderNumber={order.orderNumber}
                currentStatus={order.status as OrderStatus}
                paymentStatus={order.paymentStatus}
                grandTotal={order.grandTotal || order.total}
                onStatusChange={refreshOrder}
                onCreateShipment={() => setShowShipmentModal(true)}
              />
              
              {/* Print Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <PrintShippingLabel orderId={order._id} orderNumber={order.orderNumber} />
                <PrintInvoice orderId={order._id} orderNumber={order.orderNumber} />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address - Editable */}
          <EditShippingAddress
            orderId={order._id}
            orderStatus={order.status as OrderStatus}
            shippingAddress={order.shippingAddress || order.shipping || {}}
            onAddressChange={refreshOrder}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <CustomerInfoCard
            customerEmail={order.customerEmail}
            customerName={order.customerName}
            customerPhone={order.customerPhone}
          />

          {/* Shipment Info */}
          {(order as any).trackingNumber && (
            <ShipmentInfo
              orderId={order._id}
              trackingNumber={(order as any).trackingNumber}
              carrier={(order as any).carrier}
            />
          )}

          {/* Refund History */}
          {order.paymentStatus === 'refunded' && (
            <RefundHistory orderId={order._id} />
          )}

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Trạng thái hiện tại</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status as OrderStatus)}`}>
                    {getStatusLabel(order.status as OrderStatus)}
                  </span>
                </p>
              </div>
              <div>
                <Label htmlFor="status">Thay đổi trạng thái</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="awaiting_payment">Chờ thanh toán</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="shipping">Đang giao hàng</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                    <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Trạng thái thanh toán</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value)}
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="failed">Thanh toán thất bại</SelectItem>
                    <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Mã đơn hàng</label>
                <p className="font-mono text-sm">{order.orderNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phương thức thanh toán</label>
                <p>{order.paymentMethod}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                <p>{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                <p>{new Date(order.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Apply Coupon */}
          <ApplyCoupon
            orderId={order._id}
            orderStatus={order.status as OrderStatus}
            discountTotal={order.discountTotal || 0}
            couponCode={(order as any).couponCode}
            onCouponChange={refreshOrder}
          />

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[120px] border rounded p-2 text-sm"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Thêm ghi chú cho đơn hàng này..."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Timeline (Full Width) */}
      <div className="mt-6">
        <OrderTimeline orderId={orderId} />
      </div>

      {/* Create Shipment Modal */}
      <CreateShipmentModal
        isOpen={showShipmentModal}
        onClose={() => setShowShipmentModal(false)}
        onSuccess={refreshOrder}
        orderId={order._id}
        orderItems={order.items}
        shippingAddress={order.shippingAddress || order.shipping}
      />
    </div>
  );
}

