'use client';

import { useTodayStats } from '@/lib/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardErrorBoundary } from './ErrorBoundary';
import { ErrorState } from '@/components/ui/error-state';
import { TrendingUp, ShoppingCart, RefreshCw } from 'lucide-react';

export function TodayStatsCards() {
  const { data: todayStats, isLoading, error, refetch } = useTodayStats();

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Không thể tải thống kê hôm nay"
        message={error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu'}
        action={{
          label: 'Thử lại',
          onClick: () => refetch(),
        }}
        variant="destructive"
      />
    );
  }

  // Empty state (shouldn't happen, but handle gracefully)
  if (!todayStats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Chưa có dữ liệu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Doanh thu hôm nay',
      value: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(todayStats.revenue || 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Đơn hàng hôm nay',
      value: todayStats.orderCount || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Hoàn trả hôm nay',
      value: todayStats.refunds || 0,
      icon: RefreshCw,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <DashboardErrorBoundary title="Lỗi khi hiển thị thống kê">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardErrorBoundary>
  );
}

