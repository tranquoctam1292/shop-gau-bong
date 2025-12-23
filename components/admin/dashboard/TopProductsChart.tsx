'use client';

import { useTopProducts } from '@/lib/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardErrorBoundary } from './ErrorBoundary';
import { ErrorState } from '@/components/ui/error-state';
import type { TopProductsOptions } from '@/types/dashboard';
import dynamic from 'next/dynamic';

// Dynamic import for chart to reduce bundle size
const TopProductsChartContent = dynamic(
  () => import('./TopProductsChartContent'),
  {
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
    ssr: false, // Charts are client-side only
  }
);

interface TopProductsChartProps {
  options?: TopProductsOptions;
}

export function TopProductsChart({ options }: TopProductsChartProps) {
  const { data, isLoading, error, refetch } = useTopProducts(options ?? {});

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm bán chạy</CardTitle>
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
          <CardTitle>Sản phẩm bán chạy</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Không thể tải dữ liệu sản phẩm"
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
  if (!data || !data.data || !data.data.products || data.data.products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm bán chạy</CardTitle>
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
    <DashboardErrorBoundary title="Lỗi khi hiển thị sản phẩm">
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm bán chạy</CardTitle>
        </CardHeader>
        <CardContent>
          <TopProductsChartContent data={data.data.products} />
        </CardContent>
      </Card>
    </DashboardErrorBoundary>
  );
}

