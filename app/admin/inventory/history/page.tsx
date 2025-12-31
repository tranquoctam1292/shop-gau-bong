'use client';

/**
 * Stock History Page
 * Trang biểu đồ lịch sử tồn kho
 */

import { useState } from 'react';
import { useStockHistory } from '@/lib/hooks/useInventory';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';

// ============================================
// Component
// ============================================

export default function StockHistoryPage() {
  // State
  const [days, setDays] = useState<number>(30);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'composed'>('bar');

  // Query
  const { data, isLoading, error, refetch } = useStockHistory({ days, groupBy });

  // Handlers
  const handleDaysChange = (value: string) => {
    setDays(parseInt(value, 10));
  };

  const handleGroupByChange = (value: string) => {
    setGroupBy(value as 'day' | 'week' | 'month');
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          Biểu đồ tồn kho
        </h1>
        <p className="text-muted-foreground">
          Xem lịch sử biến động tồn kho theo thời gian
        </p>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng nhập kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                +{formatNumber(data.summary.totalIn)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng xuất kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                -{formatNumber(data.summary.totalOut)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Biến động ròng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold flex items-center gap-2 ${
                  data.summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <ArrowUpDown className="h-5 w-5" />
                {data.summary.netChange >= 0 ? '+' : ''}
                {formatNumber(data.summary.netChange)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Số lần điều chỉnh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                {formatNumber(data.summary.movementCount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
          <CardDescription>Tùy chỉnh khoảng thời gian và kiểu biểu đồ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Khoảng thời gian</label>
              <Select value={String(days)} onValueChange={handleDaysChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Chọn thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="14">14 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                  <SelectItem value="60">60 ngày</SelectItem>
                  <SelectItem value="90">90 ngày</SelectItem>
                  <SelectItem value="180">6 tháng</SelectItem>
                  <SelectItem value="365">1 năm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nhóm theo</label>
              <Select value={groupBy} onValueChange={handleGroupByChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Nhóm theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Ngày</SelectItem>
                  <SelectItem value="week">Tuần</SelectItem>
                  <SelectItem value="month">Tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kiểu biểu đồ</label>
              <div className="flex gap-2">
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  Cột
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  Đường
                </Button>
                <Button
                  variant={chartType === 'composed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('composed')}
                >
                  Kết hợp
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => refetch()}>
                Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Biến động tồn kho</CardTitle>
          <CardDescription>
            {data?.period
              ? `Từ ${data.period.startDate} đến ${data.period.endDate}`
              : 'Đang tải...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-red-500">
              Lỗi: {error.message}
            </div>
          ) : !data?.data?.length ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
              <Package className="h-12 w-12 mb-4" />
              <p>Không có dữ liệu trong khoảng thời gian này</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'bar' ? (
                <BarChart data={data.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatNumber(Number(value))}
                    labelStyle={{ color: '#333' }}
                  />
                  <Legend />
                  <Bar dataKey="totalIn" name="Nhập kho" fill="#22c55e" />
                  <Bar dataKey="totalOut" name="Xuất kho" fill="#ef4444" />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={data.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatNumber(Number(value))}
                    labelStyle={{ color: '#333' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalIn"
                    name="Nhập kho"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalOut"
                    name="Xuất kho"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netChange"
                    name="Biến động ròng"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              ) : (
                <ComposedChart data={data.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatNumber(Number(value))}
                    labelStyle={{ color: '#333' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="netChange"
                    name="Biến động ròng"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    stroke="#3b82f6"
                  />
                  <Bar dataKey="totalIn" name="Nhập kho" fill="#22c55e" />
                  <Bar dataKey="totalOut" name="Xuất kho" fill="#ef4444" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Period Info */}
      {data?.period && (
        <div className="text-sm text-muted-foreground text-center">
          Hiển thị dữ liệu {data.period.days} ngày gần nhất ({data.period.startDate} -{' '}
          {data.period.endDate})
        </div>
      )}
    </div>
  );
}
