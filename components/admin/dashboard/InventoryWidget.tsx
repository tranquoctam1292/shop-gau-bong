'use client';

import Link from 'next/link';
import { useLowStock, useStockForecast } from '@/lib/hooks/useInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Warehouse,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Package,
  AlertCircle,
} from 'lucide-react';

export function InventoryWidget() {
  const { data: lowStockData, isLoading: lowStockLoading } = useLowStock(10, true);
  const { data: forecastData, isLoading: forecastLoading } = useStockForecast({
    daysToAnalyze: 30,
    criticalThreshold: 7,
  });

  const isLoading = lowStockLoading || forecastLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tồn kho</CardTitle>
          <Warehouse className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const lowStockCount = lowStockData?.total || 0;
  const criticalCount = forecastData?.summary?.criticalCount || 0;
  const warningCount = forecastData?.summary?.warningCount || 0;

  // Get top 3 critical items from forecast
  const criticalItems = forecastData?.items
    ?.filter((item) => item.daysUntilStockout !== null && item.daysUntilStockout <= 7)
    ?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Tồn kho</CardTitle>
        <Warehouse className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-lg font-bold text-red-700">{criticalCount}</span>
              </div>
              <p className="text-xs text-red-600">Nguy cấp</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-lg font-bold text-yellow-700">{warningCount}</span>
              </div>
              <p className="text-xs text-yellow-600">Cảnh báo</p>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <span className="text-lg font-bold text-orange-700">{lowStockCount}</span>
              </div>
              <p className="text-xs text-orange-600">Tồn thấp</p>
            </div>
          </div>

          {/* Critical Items List */}
          {criticalItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Sắp hết hàng
              </p>
              {criticalItems.map((item, index) => (
                <div
                  key={`${item.productId}-${item.variationId || ''}-${index}`}
                  className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                        {item.productName}
                      </p>
                      {item.variationLabel && (
                        <p className="text-xs text-gray-500">{item.variationLabel}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-700">
                      {item.daysUntilStockout === 0
                        ? 'Hết'
                        : `${item.daysUntilStockout} ngày`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Còn {item.availableStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {criticalItems.length === 0 && lowStockCount === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Tồn kho ổn định</p>
            </div>
          )}

          {/* View All Link */}
          <div className="pt-2 border-t">
            <Link
              href="/admin/inventory"
              className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 transition"
            >
              <span>Xem chi tiết tồn kho</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
