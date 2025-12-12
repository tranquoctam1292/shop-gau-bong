/**
 * Print Invoice Component
 * 
 * Generates and downloads invoice PDF for an order
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface PrintInvoiceProps {
  orderId: string;
  orderNumber: string;
}

export function PrintInvoice({ orderId, orderNumber }: PrintInvoiceProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoice/${orderId}`);
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Có lỗi xảy ra khi tải hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant="outline"
      size="sm"
      className="min-h-[44px]"
    >
      <FileDown className="w-4 h-4 mr-2" />
      {loading ? 'Đang tải...' : 'Tải hóa đơn PDF'}
    </Button>
  );
}

