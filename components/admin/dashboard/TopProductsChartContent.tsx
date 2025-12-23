'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TopProduct } from '@/types/dashboard';

interface TopProductsChartContentProps {
  data: TopProduct[];
}

export default function TopProductsChartContent({ data }: TopProductsChartContentProps) {
  // Format data for Recharts (limit to top 10 for readability)
  const chartData = data.slice(0, 10).map((product) => ({
    name: product.productName.length > 20 
      ? product.productName.substring(0, 20) + '...' 
      : product.productName,
    revenue: product.revenue,
    quantity: product.quantity,
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
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={100}
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
            return [value, 'Số lượng'];
          }}
          labelStyle={{ color: '#000' }}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <Legend />
        <Bar dataKey="revenue" fill="#f97316" name="Doanh thu" />
        <Bar dataKey="quantity" fill="#10b981" name="Số lượng" />
      </BarChart>
    </ResponsiveContainer>
  );
}

