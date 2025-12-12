/**
 * Edit Order Items Component
 * 
 * Component để edit order items:
 * - Display current order items với edit/remove buttons
 * - "Thêm sản phẩm" button (mở product selector modal)
 * - "Xóa sản phẩm" button (với confirmation)
 * - Update quantity (với validation)
 * - Auto-recalculate totals khi items change
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ProductSelectorModal } from './ProductSelectorModal';
import { canEditOrder, type OrderStatus } from '@/lib/utils/orderStateMachine';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  variationId?: string;
  variant?: {
    size?: string;
    color?: string;
  };
}

interface EditOrderItemsProps {
  orderId: string;
  orderStatus: OrderStatus;
  items: OrderItem[];
  onItemsChange: () => void; // Callback to refresh order data
}

interface Product {
  _id: string;
  name: string;
  price: number;
  type: 'simple' | 'variable';
  variants?: Array<{
    id: string;
    size?: string;
    color?: string;
    price: number;
  }>;
}

export function EditOrderItems({
  orderId,
  orderStatus,
  items,
  onItemsChange,
}: EditOrderItemsProps) {
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [updatingQuantities, setUpdatingQuantities] = useState<Record<string, number>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const canEdit = canEditOrder(orderStatus);

  const handleAddProduct = async (product: Product, variantId?: string, quantity: number = 1) => {
    if (!canEdit) {
      alert('Đơn hàng không thể chỉnh sửa ở trạng thái này');
      return;
    }

    setLoading('add');
    try {
      // Check stock availability first
      try {
        const stockResponse = await fetch(
          `/api/admin/products/${product._id}/stock${variantId ? `?variationId=${variantId}&quantity=${quantity}` : `?quantity=${quantity}`}`
        );
        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          if (!stockData.stock.canFulfill) {
            alert(
              `Không đủ hàng trong kho. Còn lại: ${stockData.stock.available}, Yêu cầu: ${quantity}`
            );
            return;
          }
        }
      } catch (stockError) {
        console.error('Error checking stock:', stockError);
        // Continue with add if stock check fails (might be non-stock product)
      }

      // Get product price
      let price = product.price;
      if (variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (variant) {
          price = variant.price;
        }
      }

      const response = await fetch(`/api/admin/orders/${orderId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          productId: product._id,
          variationId: variantId,
          productName: product.name,
          quantity,
          price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || error.error || 'Có lỗi xảy ra');
        return;
      }

      onItemsChange();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Có lỗi xảy ra khi thêm sản phẩm');
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!canEdit) {
      alert('Đơn hàng không thể chỉnh sửa ở trạng thái này');
      return;
    }

    setLoading(itemId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          itemId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      onItemsChange();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Có lỗi xảy ra khi xóa sản phẩm');
    } finally {
      setLoading(null);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      return;
    }
    setUpdatingQuantities({ ...updatingQuantities, [itemId]: newQuantity });
  };

  const handleQuantityBlur = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      setUpdatingQuantities({ ...updatingQuantities, [itemId]: undefined });
      return;
    }

    const item = items.find((i) => i._id === itemId);
    if (!item || item.quantity === quantity) {
      setUpdatingQuantities({ ...updatingQuantities, [itemId]: undefined });
      return;
    }

    if (!canEdit) {
      alert('Đơn hàng không thể chỉnh sửa ở trạng thái này');
      setUpdatingQuantities({ ...updatingQuantities, [itemId]: undefined });
      return;
    }

    setLoading(itemId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_quantity',
          itemId,
          quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        setUpdatingQuantities({ ...updatingQuantities, [itemId]: undefined });
        return;
      }

      onItemsChange();
      setUpdatingQuantities({ ...updatingQuantities, [itemId]: undefined });
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Có lỗi xảy ra khi cập nhật số lượng');
      setUpdatingQuantities({ ...updatingQuantities, [itemId]: undefined });
    } finally {
      setLoading(null);
    }
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Đơn hàng không thể chỉnh sửa ở trạng thái này
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chi tiết đơn hàng</CardTitle>
            <Button
              onClick={() => setShowProductModal(true)}
              size="sm"
              className="min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có sản phẩm nào trong đơn hàng
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item._id}
                  className="flex justify-between items-start border-b pb-4 gap-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.variant && (
                      <p className="text-sm text-muted-foreground">
                        {item.variant.size && `Size: ${item.variant.size}`}
                        {item.variant.size && item.variant.color && ' • '}
                        {item.variant.color && `Màu: ${item.variant.color}`}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Label htmlFor={`quantity-${item._id}`} className="text-sm">
                        Số lượng:
                      </Label>
                      <Input
                        id={`quantity-${item._id}`}
                        type="number"
                        min="1"
                        value={
                          updatingQuantities[item._id] !== undefined
                            ? updatingQuantities[item._id]
                            : item.quantity
                        }
                        onChange={(e) =>
                          handleQuantityChange(item._id, parseInt(e.target.value) || 1)
                        }
                        onBlur={(e) =>
                          handleQuantityBlur(item._id, parseInt(e.target.value) || 1)
                        }
                        disabled={loading === item._id}
                        className="w-20 h-9"
                      />
                      {loading === item._id && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-medium">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.price)}{' '}
                      / sản phẩm
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(item._id)}
                      disabled={loading === item._id}
                      className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px]"
                    >
                      {loading === item._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelect={handleAddProduct}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm !== null}
        onOpenChange={() => setShowDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleRemoveItem(showDeleteConfirm)}
              className="min-h-[44px]"
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

