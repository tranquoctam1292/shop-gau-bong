'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RevenueChartData } from '@/types/dashboard';

interface RevenueChartContentProps {
  data: RevenueChartData;
}

export default function RevenueChartContent({ data }: RevenueChartContentProps) {
  // Format data for Recharts
  const chartData = data.data.map((point) => ({
    date: point.date,
    revenue: point.revenue,
    orders: point.orderCount,
  }));

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => {
            if (value === undefined) return ['', ''];
            if (name === 'revenue') {
              return [formatCurrency(value), 'Doanh thu'];
            }
            return [value, 'Đơn hàng'];
          }}
          labelStyle={{ color: '#000' }}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#f97316"
          strokeWidth={2}
          name="Doanh thu"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#10b981"
          strokeWidth={2}
          name="Đơn hàng"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

