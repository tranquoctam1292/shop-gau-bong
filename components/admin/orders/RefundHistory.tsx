/**
 * Refund History Component
 * 
 * Displays refund history for an order:
 * - List of all refunds
 * - Refund amount, type, status
 * - Refund date and reason
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface RefundHistoryProps {
  orderId: string;
}

interface Refund {
  _id?: string;
  amount: number;
  type: 'partial' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reason?: string;
  createdAt: string;
  processedAt?: string;
}

export function RefundHistory({ orderId }: RefundHistoryProps) {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRefunds() {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/refund`);
        if (!response.ok) {
          throw new Error('Failed to fetch refunds');
        }
        const data = await response.json();
        setRefunds(data.refunds || []);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tải lịch sử hoàn tiền');
      } finally {
        setLoading(false);
      }
    }

    fetchRefunds();
  }, [orderId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Lịch sử hoàn tiền
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Đang tải...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Lịch sử hoàn tiền
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (refunds.length === 0) {
    return null; // Don't show if no refunds
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    return type === 'full' ? 'Hoàn tiền toàn bộ' : 'Hoàn tiền một phần';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Lịch sử hoàn tiền ({refunds.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {refunds.map((refund) => (
            <div
              key={refund._id}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(refund.status)}
                  <span className="font-semibold">{getTypeLabel(refund.type)}</span>
                </div>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(refund.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Trạng thái: {getStatusLabel(refund.status)}</span>
                <span>
                  {new Date(refund.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              {refund.reason && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Lý do:</span> {refund.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

