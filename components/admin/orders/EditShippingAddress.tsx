/**
 * Edit Shipping Address Component
 * 
 * Component để edit shipping address:
 * - Form với Province/District/Ward selectors
 * - Address input fields
 * - Save button
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Loader2, Edit2 } from 'lucide-react';
import { canEditOrder, type OrderStatus } from '@/lib/utils/orderStateMachine';
import { useToastContext } from '@/components/providers/ToastProvider';

interface ShippingAddress {
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
}

interface EditShippingAddressProps {
  orderId: string;
  orderStatus: OrderStatus;
  shippingAddress: ShippingAddress;
  onAddressChange: () => void; // Callback to refresh order data
}

export function EditShippingAddress({
  orderId,
  orderStatus,
  shippingAddress,
  onAddressChange,
}: EditShippingAddressProps) {
  const { showToast } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ShippingAddress>(shippingAddress);

  const canEdit = canEditOrder(orderStatus);

  const handleSave = async () => {
    if (!canEdit) {
      showToast('Đơn hàng không thể chỉnh sửa ở trạng thái này', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi cập nhật địa chỉ', 'error');
        return;
      }

      showToast('Đã cập nhật địa chỉ giao hàng thành công', 'success');
      onAddressChange();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating shipping address:', error);
      showToast('Có lỗi xảy ra khi cập nhật địa chỉ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(shippingAddress);
    setIsEditing(false);
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Địa chỉ giao hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-500">Người nhận</label>
            <p>
              {shippingAddress.firstName} {shippingAddress.lastName}
            </p>
          </div>
          {shippingAddress.phone && (
            <div>
              <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
              <p>{shippingAddress.phone}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
            <p>
              {shippingAddress.address1}
              {shippingAddress.address2 && `, ${shippingAddress.address2}`}
              {shippingAddress.ward && `, ${shippingAddress.ward}`}
              {shippingAddress.district && `, ${shippingAddress.district}`}
              {shippingAddress.province && `, ${shippingAddress.province}`}
              {shippingAddress.city && `, ${shippingAddress.city}`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Địa chỉ giao hàng</CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="min-h-[44px]"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Họ</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Tên</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address1">Địa chỉ</Label>
              <Input
                id="address1"
                value={formData.address1 || ''}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address2">Địa chỉ phụ (tùy chọn)</Label>
              <Input
                id="address2"
                value={formData.address2 || ''}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Tỉnh/Thành phố</Label>
                <Input
                  id="province"
                  value={formData.province || ''}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Quận/Huyện</Label>
                <Input
                  id="district"
                  value={formData.district || ''}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ward">Phường/Xã</Label>
                <Input
                  id="ward"
                  value={formData.ward || ''}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Thành phố</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Mã bưu điện</Label>
                <Input
                  id="postcode"
                  value={formData.postcode || ''}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={loading} className="min-h-[44px]">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-500">Người nhận</label>
              <p>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
            </div>
            {shippingAddress.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                <p>{shippingAddress.phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
              <p>
                {shippingAddress.address1}
                {shippingAddress.address2 && `, ${shippingAddress.address2}`}
                {shippingAddress.ward && `, ${shippingAddress.ward}`}
                {shippingAddress.district && `, ${shippingAddress.district}`}
                {shippingAddress.province && `, ${shippingAddress.province}`}
                {shippingAddress.city && `, ${shippingAddress.city}`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

