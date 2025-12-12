/**
 * Print Shipping Label Component
 * 
 * Generates printable shipping label for an order
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintShippingLabelProps {
  orderId: string;
  orderNumber: string;
}

export function PrintShippingLabel({ orderId, orderNumber }: PrintShippingLabelProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/orders/bulk-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [orderId] }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      const html = await response.text();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.');
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing shipping label:', error);
      alert('Có lỗi xảy ra khi in nhãn vận chuyển');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={loading}
      variant="outline"
      size="sm"
      className="min-h-[44px]"
    >
      <Printer className="w-4 h-4 mr-2" />
      {loading ? 'Đang tải...' : 'In nhãn vận chuyển'}
    </Button>
  );
}

