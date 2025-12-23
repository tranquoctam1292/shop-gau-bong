'use client';

import { useTopCustomers } from '@/lib/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardErrorBoundary } from './ErrorBoundary';
import { ErrorState } from '@/components/ui/error-state';
import type { TopCustomersOptions } from '@/types/dashboard';
import { User } from 'lucide-react';

interface TopCustomersListProps {
  options?: TopCustomersOptions;
}

export function TopCustomersList({ options }: TopCustomersListProps) {
  const { data, isLoading, error, refetch } = useTopCustomers(options ?? {});

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Khách hàng hàng đầu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Khách hàng hàng đầu</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Không thể tải danh sách khách hàng"
            message={error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu'}
            action={{
              label: 'Thử lại',
              onClick: () => refetch(),
            }}
            variant="destructive"
          />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || !data.data || !data.data.customers || data.data.customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Khách hàng hàng đầu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Chưa có dữ liệu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const customers = data.data.customers;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <DashboardErrorBoundary title="Lỗi khi hiển thị khách hàng">
      <Card>
        <CardHeader>
          <CardTitle>Khách hàng hàng đầu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer, index) => (
              <div
                key={customer.customerEmail}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">
                      {customer.customerName || 'Khách hàng'}
                    </p>
                    {index < 3 && (
                      <span className="text-xs font-bold text-primary">
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {customer.customerEmail}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{customer.orderCount} đơn hàng</span>
                    <span>•</span>
                    <span>TB: {formatCurrency(customer.averageOrderValue)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-primary">
                    {formatCurrency(customer.revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Tổng</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardErrorBoundary>
  );
}

