'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStockForecast } from '@/lib/hooks/useInventory';
import type { StockForecastFilters, StockForecastItem } from '@/types/inventory';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
} from 'lucide-react';

export default function ForecastPage() {
  const [filters, setFilters] = useState<StockForecastFilters>({
    daysToAnalyze: 30,
    daysToForecast: 30,
    criticalThreshold: 7,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useStockForecast(filters);

  const getSeverityColor = (item: StockForecastItem) => {
    if (item.daysUntilStockout === null) return 'bg-gray-100 text-gray-600';
    if (item.daysUntilStockout <= (filters.criticalThreshold || 7)) {
      return 'bg-red-100 text-red-700';
    }
    if (item.daysUntilStockout <= (filters.criticalThreshold || 7) * 2) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-green-100 text-green-700';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Cao</span>;
      case 'medium':
        return <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">TB</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Thấp</span>;
    }
  };

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/inventory"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Dự báo tồn kho
            </h1>
            <p className="text-sm text-gray-500">
              Dự báo thời gian hết hàng dựa trên lịch sử bán
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Bộ lọc"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày phân tích
              </label>
              <select
                value={filters.daysToAnalyze}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    daysToAnalyze: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={7}>7 ngày</option>
                <option value={14}>14 ngày</option>
                <option value={30}>30 ngày</option>
                <option value={60}>60 ngày</option>
                <option value={90}>90 ngày</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dự báo trước
              </label>
              <select
                value={filters.daysToForecast}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    daysToForecast: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={7}>7 ngày</option>
                <option value={14}>14 ngày</option>
                <option value={30}>30 ngày</option>
                <option value={60}>60 ngày</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngưỡng cảnh báo
              </label>
              <select
                value={filters.criticalThreshold}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    criticalThreshold: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={3}>3 ngày</option>
                <option value={5}>5 ngày</option>
                <option value={7}>7 ngày</option>
                <option value={14}>14 ngày</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn tối thiểu
              </label>
              <select
                value={filters.minSales || 0}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minSales: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>Tất cả</option>
                <option value={1}>Ít nhất 1</option>
                <option value={3}>Ít nhất 3</option>
                <option value={5}>Ít nhất 5</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700 font-medium">Nguy cấp</span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              {data.summary.criticalCount}
            </p>
            <p className="text-xs text-red-600">
              Hết trong {filters.criticalThreshold} ngày
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-700 font-medium">Cảnh báo</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700">
              {data.summary.warningCount}
            </p>
            <p className="text-xs text-yellow-600">
              Hết trong {(filters.criticalThreshold || 7) * 2} ngày
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700 font-medium">An toàn</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {data.summary.healthyCount}
            </p>
            <p className="text-xs text-green-600">Còn hàng lâu</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">Không bán</span>
            </div>
            <p className="text-2xl font-bold text-gray-700">
              {data.summary.noSalesCount}
            </p>
            <p className="text-xs text-gray-600">Không có dữ liệu</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white border rounded-lg p-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Đang phân tích dữ liệu bán hàng...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <p className="text-red-700">{(error as Error).message}</p>
        </div>
      )}

      {/* Forecast Table */}
      {data && !isLoading && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Sản phẩm
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">
                    Tồn kho
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">
                    Bán/ngày
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                    Xu hướng
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                    Còn lại
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                    Ngày hết
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">
                    Đề xuất nhập
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                    Độ tin cậy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Không có sản phẩm nào có quản lý tồn kho
                    </td>
                  </tr>
                ) : (
                  data.items.map((item, index) => (
                    <tr key={`${item.productId}-${item.variationId || ''}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.thumbnail && (
                            <Image
                              src={item.thumbnail}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded"
                              unoptimized
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                              {item.productName}
                            </p>
                            {item.variationLabel && (
                              <p className="text-sm text-gray-500">{item.variationLabel}</p>
                            )}
                            {item.sku && (
                              <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{item.availableStock}</span>
                        {item.reservedQuantity > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({item.reservedQuantity} giữ)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.averageDailySales.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(item.salesTrend)}
                          <span className="text-xs text-gray-500 capitalize">
                            {item.salesTrend === 'increasing'
                              ? 'Tăng'
                              : item.salesTrend === 'decreasing'
                              ? 'Giảm'
                              : 'Ổn định'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-sm font-medium ${getSeverityColor(
                            item
                          )}`}
                        >
                          {item.daysUntilStockout === null
                            ? '-'
                            : item.daysUntilStockout === 0
                            ? 'Hết'
                            : `${item.daysUntilStockout} ngày`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {formatDate(item.estimatedStockoutDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-blue-600">
                        {item.reorderSuggestion > 0 ? `+${item.reorderSuggestion}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getConfidenceBadge(item.confidence)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 text-sm text-gray-500">
        <p className="font-medium mb-2">Chú thích:</p>
        <ul className="space-y-1">
          <li>
            <span className="inline-block w-3 h-3 rounded bg-red-100 mr-2" />
            Nguy cấp: Hết hàng trong {filters.criticalThreshold} ngày
          </li>
          <li>
            <span className="inline-block w-3 h-3 rounded bg-yellow-100 mr-2" />
            Cảnh báo: Hết hàng trong {(filters.criticalThreshold || 7) * 2} ngày
          </li>
          <li>
            <span className="inline-block w-3 h-3 rounded bg-green-100 mr-2" />
            An toàn: Còn hàng lâu hơn {(filters.criticalThreshold || 7) * 2} ngày
          </li>
          <li>
            <span className="inline-block w-3 h-3 rounded bg-gray-100 mr-2" />
            Không có dữ liệu bán hàng trong {filters.daysToAnalyze} ngày qua
          </li>
        </ul>
      </div>
    </div>
  );
}
