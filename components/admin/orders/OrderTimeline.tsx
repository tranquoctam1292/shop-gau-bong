/**
 * Order Timeline Component
 * 
 * Displays order history as a timeline with:
 * - Icons and colors for different actions
 * - Actor name and timestamp
 * - Grouped by date (Today, Yesterday, Last week, etc.)
 * - Mobile-responsive layout
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Truck,
  CreditCard,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { getStatusLabel, getStatusColor, type OrderStatus } from '@/lib/utils/orderStateMachine';
import type { OrderHistoryEntry } from '@/lib/services/orderHistory';

interface OrderTimelineProps {
  orderId: string;
}

interface HistoryEntry extends Omit<OrderHistoryEntry, '_id' | 'createdAt'> {
  _id: string;
  createdAt: string;
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const [histories, setHistories] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/orders/${orderId}/history`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order history');
        }
        
        const data = await response.json();
        setHistories(data.histories || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchHistory();
    }
  }, [orderId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'update_status':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'update_payment_status':
      case 'payment_received':
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'cancel':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'refund':
        return <XCircle className="h-5 w-5 text-orange-500" />;
      case 'shipment_created':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'note_added':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 border-green-300';
      case 'update_status':
        return 'bg-blue-100 border-blue-300';
      case 'update_payment_status':
      case 'payment_received':
        return 'bg-green-100 border-green-300';
      case 'cancel':
        return 'bg-red-100 border-red-300';
      case 'refund':
        return 'bg-orange-100 border-orange-300';
      case 'shipment_created':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (entryDate.getTime() === today.getTime()) {
      return 'Hôm nay';
    } else if (entryDate.getTime() === yesterday.getTime()) {
      return 'Hôm qua';
    } else if (entryDate >= weekAgo) {
      return 'Tuần này';
    } else {
      return d.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupHistoriesByDate = (histories: HistoryEntry[]) => {
    const groups: Record<string, HistoryEntry[]> = {};
    
    histories.forEach((history) => {
      const date = new Date(history.createdAt);
      const dateKey = formatDate(date);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(history);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Đang tải lịch sử...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (histories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Chưa có lịch sử thay đổi
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedHistories = groupHistoriesByDate(histories);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Lịch sử đơn hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedHistories)
            .sort(([dateA], [dateB]) => {
              // Sort dates: Today > Yesterday > This week > Older dates
              const order: Record<string, number> = {
                'Hôm nay': 0,
                'Hôm qua': 1,
                'Tuần này': 2,
              };
              return (order[dateA] ?? 3) - (order[dateB] ?? 3);
            })
            .map(([dateLabel, dateHistories]) => (
              <div key={dateLabel} className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  {dateLabel}
                </div>
                <div className="relative pl-8 space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {dateHistories
                    .sort((a, b) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((history, index) => (
                      <div
                        key={history._id || index}
                        className={`relative flex gap-4 p-4 rounded-lg border ${getActionColor(
                          history.action
                        )}`}
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-[29px] top-6 w-6 h-6 bg-background border-2 border-border rounded-full flex items-center justify-center">
                          {getActionIcon(history.action)}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-4">
                            <p className="font-medium text-sm">{history.description}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(history.createdAt)}
                            </span>
                          </div>
                          
                          {history.actorName && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>
                                {history.actorName} ({history.actorType === 'admin' ? 'Admin' : history.actorType === 'customer' ? 'Khách hàng' : 'Hệ thống'})
                              </span>
                            </div>
                          )}
                          
                          {history.metadata && Object.keys(history.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {history.metadata.oldStatus && history.metadata.newStatus && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${getStatusColor(
                                      history.metadata.oldStatus as OrderStatus
                                    )}`}
                                  >
                                    {getStatusLabel(history.metadata.oldStatus as OrderStatus)}
                                  </span>
                                  <span>→</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${getStatusColor(
                                      history.metadata.newStatus as OrderStatus
                                    )}`}
                                  >
                                    {getStatusLabel(history.metadata.newStatus as OrderStatus)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

