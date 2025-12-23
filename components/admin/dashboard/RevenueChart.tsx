'use client';

import { useRevenueChart } from '@/lib/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardErrorBoundary } from './ErrorBoundary';
import { ErrorState } from '@/components/ui/error-state';
import type { DashboardStatsOptions } from '@/types/dashboard';
import dynamic from 'next/dynamic';

// Dynamic import for chart to reduce bundle size
const RevenueChartContent = dynamic(
  () => import('./RevenueChartContent'),
  {
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
    ssr: false, // Charts are client-side only
  }
);

interface RevenueChartProps {
  options?: DashboardStatsOptions;
}

export function RevenueChart({ options }: RevenueChartProps) {
  const { data: chartData, isLoading, error, refetch } = useRevenueChart(options ?? {});

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Không thể tải biểu đồ"
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
  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Chưa có dữ liệu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DashboardErrorBoundary title="Lỗi khi hiển thị biểu đồ">
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChartContent data={chartData} />
        </CardContent>
      </Card>
    </DashboardErrorBoundary>
  );
}

