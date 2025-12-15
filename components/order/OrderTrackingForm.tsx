'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastContext } from '@/components/providers/ToastProvider';

export function OrderTrackingForm() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber || !email) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement order tracking API call
      // const response = await fetch(`/api/cms/orders/${orderNumber}?email=${email}`);
      // const data = await response.json();
      
      showToast('Tính năng đang được phát triển', 'info');
    } catch (error) {
      showToast('Có lỗi xảy ra. Vui lòng thử lại sau', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="orderNumber">Mã đơn hàng</Label>
        <Input
          id="orderNumber"
          type="text"
          placeholder="Nhập mã đơn hàng"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email đặt hàng</Label>
        <Input
          id="email"
          type="email"
          placeholder="Nhập email đặt hàng"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Đang tìm kiếm...' : 'Theo dõi đơn hàng'}
      </Button>
    </form>
  );
}

