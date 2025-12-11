'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    province: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  total: number;
  shippingCost: number;
  subtotal: number;
  adminNote?: string;
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
    };
    return texts[status] || status;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item._id} className="flex justify-between items-start border-b pb-4">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variant && (
                        <p className="text-sm text-gray-500">
                          {item.variant.size && `Size: ${item.variant.size}`}
                          {item.variant.size && item.variant.color && ' • '}
                          {item.variant.color && `Màu: ${item.variant.color}`}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.total)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.price)} / sản phẩm
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(order.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Tổng cộng:</span>
                    <span>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin khách hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Tên khách hàng</label>
                <p>{order.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p>{order.customerEmail}</p>
              </div>
              {order.customerPhone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p>{order.customerPhone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Địa chỉ giao hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Người nhận</label>
                <p>{order.shippingAddress.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                <p>{order.shippingAddress.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                <p>
                  {order.shippingAddress.address}, {order.shippingAddress.ward},{' '}
                  {order.shippingAddress.district}, {order.shippingAddress.province}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Trạng thái thanh toán</Label>
                <Select
                  id="paymentStatus"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="pending">Chờ thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="failed">Thanh toán thất bại</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Trạng thái hiện tại</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </p>
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
    </div>
  );
}

