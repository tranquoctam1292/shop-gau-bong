/**
 * Create Shipment Modal
 * 
 * Modal để tạo vận đơn cho order:
 * - Select carrier (GHTK, GHN, Custom)
 * - Input weight (auto-calculate từ order items)
 * - Display shipping address
 * - Create shipment button
 * - Display tracking number sau khi tạo
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, Truck } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback to refresh order data
  orderId: string;
  orderItems: Array<{
    _id: string;
    productId: string;
    productName: string;
    quantity: number;
    weight?: number;
  }>;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    city?: string;
    province?: string;
    district?: string;
    ward?: string;
    phone?: string;
  };
}

export function CreateShipmentModal({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  orderItems,
  shippingAddress,
}: CreateShipmentModalProps) {
  const { showToast } = useToastContext();
  const [carrier, setCarrier] = useState<'ghtk' | 'ghn' | 'custom'>('ghtk');
  const [weight, setWeight] = useState<string>('');
  const [carrierService, setCarrierService] = useState<string>('Standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  // Calculate weight from order items
  useEffect(() => {
    if (!weight && orderItems.length > 0) {
      const calculatedWeight = orderItems.reduce((total, item) => {
        const itemWeight = item.weight || 0.5; // Default 0.5kg per item
        return total + itemWeight * item.quantity;
      }, 0);
      setWeight(calculatedWeight.toFixed(2));
    }
  }, [orderItems, weight]);

  const handleCreateShipment = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      setError('Vui lòng nhập trọng lượng hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier,
          weight: parseFloat(weight),
          carrierService: carrierService || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Có lỗi xảy ra khi tạo vận đơn';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        return;
      }

      const data = await response.json();
      setTrackingNumber(data.shipment.trackingNumber);
      showToast(`Đã tạo vận đơn thành công. Mã vận đơn: ${data.shipment.trackingNumber}`, 'success');
      
      // Wait a bit before closing to show tracking number
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error creating shipment:', error);
      const errorMessage = 'Có lỗi xảy ra khi tạo vận đơn';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCarrier('ghtk');
    setWeight('');
    setCarrierService('Standard');
    setError(null);
    setTrackingNumber(null);
    onClose();
  };

  const getCarrierLabel = (carrier: string) => {
    const labels: Record<string, string> = {
      ghtk: 'Giao Hàng Tiết Kiệm (GHTK)',
      ghn: 'Giao Hàng Nhanh (GHN)',
      custom: 'Tùy chỉnh',
    };
    return labels[carrier] || carrier;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Tạo vận đơn
          </DialogTitle>
        </DialogHeader>

        {trackingNumber ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <Package className="h-5 w-5" />
                <span className="font-semibold">Vận đơn đã được tạo thành công!</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Mã vận đơn:</span>
                  <p className="font-mono text-lg font-bold">{trackingNumber}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Đơn vị vận chuyển:</span>
                  <p className="font-semibold">{getCarrierLabel(carrier)}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Đơn hàng đã được chuyển sang trạng thái &quot;Đang giao hàng&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Carrier Selection */}
            <div className="space-y-2">
              <Label htmlFor="carrier">Đơn vị vận chuyển</Label>
              <Select
                value={carrier}
                onValueChange={(value) => setCarrier(value as 'ghtk' | 'ghn' | 'custom')}
              >
                <SelectTrigger id="carrier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ghtk">Giao Hàng Tiết Kiệm (GHTK)</SelectItem>
                  <SelectItem value="ghn">Giao Hàng Nhanh (GHN)</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight Input */}
            <div className="space-y-2">
              <Label htmlFor="weight">
                Trọng lượng (kg) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Tự động tính từ sản phẩm"
              />
              <p className="text-xs text-muted-foreground">
                Trọng lượng được tính tự động từ sản phẩm trong đơn hàng
              </p>
            </div>

            {/* Carrier Service (optional) */}
            {carrier !== 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="carrier-service">Loại dịch vụ</Label>
                <Select
                  value={carrierService}
                  onValueChange={(value) => setCarrierService(value)}
                >
                  <SelectTrigger id="carrier-service" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Tiêu chuẩn</SelectItem>
                    <SelectItem value="Express">Nhanh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Shipping Address Display */}
            {shippingAddress && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <Label className="text-sm font-medium">Địa chỉ giao hàng:</Label>
                <p className="text-sm">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                <p className="text-sm">
                  {shippingAddress.address1}
                  {shippingAddress.ward && `, ${shippingAddress.ward}`}
                  {shippingAddress.district && `, ${shippingAddress.district}`}
                  {shippingAddress.province && `, ${shippingAddress.province}`}
                </p>
                {shippingAddress.phone && (
                  <p className="text-sm">ĐT: {shippingAddress.phone}</p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {trackingNumber ? (
            <Button onClick={handleClose} className="min-h-[44px]">
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateShipment}
                disabled={loading || !weight || parseFloat(weight) <= 0}
                className="min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 mr-2" />
                    Tạo vận đơn
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

