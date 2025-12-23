/**
 * Customer Info Card Component
 * 
 * Displays enhanced customer information:
 * - Customer name, email, phone
 * - LTV (Lifetime Value) calculation
 * - Link to customer order history (if available)
 * - Customer type (VIP, Regular, New)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, DollarSign, ShoppingBag, Calendar, Crown } from 'lucide-react';
import Link from 'next/link';

interface CustomerInfoCardProps {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  firstOrderDate?: string;
  averageOrderValue: number;
}

export function CustomerInfoCard({
  customerEmail,
  customerName,
  customerPhone,
}: CustomerInfoCardProps) {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomerStats() {
      if (!customerEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/customers/${encodeURIComponent(customerEmail)}/stats`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Customer not found or no orders - this is OK
            setStats({
              totalOrders: 0,
              totalSpent: 0,
              averageOrderValue: 0,
            });
            return;
          }
          throw new Error('Failed to fetch customer stats');
        }
        
        const data = await response.json();
        setStats(data.stats);
      } catch (err: any) {
        setError(err.message || 'Failed to load customer stats');
        // Set default stats on error
        setStats({
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCustomerStats();
  }, [customerEmail]);

  const getCustomerType = (): { label: string; color: string; icon: React.ReactNode } => {
    if (!stats) {
      return { label: 'Khách mới', color: 'text-blue-600', icon: <User className="h-4 w-4" /> };
    }

    if (stats.totalOrders === 0) {
      return { label: 'Khách mới', color: 'text-blue-600', icon: <User className="h-4 w-4" /> };
    }

    if (stats.totalSpent >= 5000000) {
      return { label: 'VIP', color: 'text-purple-600', icon: <Crown className="h-4 w-4" /> };
    }

    if (stats.totalOrders >= 5 || stats.totalSpent >= 2000000) {
      return { label: 'Thân thiết', color: 'text-green-600', icon: <User className="h-4 w-4" /> };
    }

    return { label: 'Thường', color: 'text-gray-600', icon: <User className="h-4 w-4" /> };
  };

  const customerType = getCustomerType();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Thông tin khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Type Badge */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${customerType.color}`}>
            {customerType.icon}
            {customerType.label}
          </span>
        </div>

        {/* Customer Details */}
        <div className="space-y-3">
          {customerName && (
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{customerName}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm break-all">{customerEmail}</p>
            </div>
          </div>

          {customerPhone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">{customerPhone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Customer Stats */}
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Đang tải thống kê...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-sm text-red-500">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShoppingBag className="h-3 w-3" />
                  Tổng đơn hàng
                </div>
                <p className="text-lg font-semibold">{stats.totalOrders}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Tổng chi tiêu
                </div>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(stats.totalSpent)}
                </p>
              </div>
            </div>

            {stats.totalOrders > 0 && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Giá trị đơn trung bình
                  </div>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(stats.averageOrderValue)}
                  </p>
                </div>

                {stats.lastOrderDate && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Đơn hàng gần nhất
                    </div>
                    <p className="text-sm">
                      {new Date(stats.lastOrderDate).toLocaleDateString('vi-VN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Link to customer orders */}
            {stats.totalOrders > 0 && (
              <Link href={`/admin/orders?search=${encodeURIComponent(customerEmail)}`}>
                <Button variant="outline" size="sm" className="w-full mt-3 min-h-[44px]">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Xem tất cả đơn hàng ({stats.totalOrders})
                </Button>
              </Link>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

