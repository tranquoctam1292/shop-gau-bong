'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MousePointerClick, ShoppingCart, Search, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  productId: string;
  totals: {
    views: number;
    clicks: number;
    conversions: number;
    searches: number;
  };
  conversionRate: number;
  popularVariants: Array<{ variant: string; count: number }>;
  searchKeywords: Array<{ keyword: string; count: number }>;
  dailyData: Array<{
    date: string;
    views: number;
    clicks: number;
    conversions: number;
    searches: number;
  }>;
}

interface ProductAnalyticsProps {
  productId: string;
}

export function ProductAnalytics({ productId }: ProductAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [productId, startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/admin/products/${productId}/analytics?${params}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-gray-500">Không có dữ liệu phân tích</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Lọc theo thời gian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lượt xem</p>
                <p className="text-2xl font-bold">{analytics.totals.views.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lượt click</p>
                <p className="text-2xl font-bold">{analytics.totals.clicks.toLocaleString()}</p>
              </div>
              <MousePointerClick className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chuyển đổi</p>
                <p className="text-2xl font-bold">{analytics.totals.conversions.toLocaleString()}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Variants */}
      {analytics.popularVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Biến thể phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.popularVariants.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{item.variant}</span>
                  <span className="text-sm font-medium">{item.count} lượt</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Keywords */}
      {analytics.searchKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Từ khóa tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.searchKeywords.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                >
                  <Search className="w-3 h-3" />
                  <span>{item.keyword}</span>
                  <span className="text-xs">({item.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Data Table */}
      {analytics.dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dữ liệu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ngày</th>
                    <th className="text-right p-2">Lượt xem</th>
                    <th className="text-right p-2">Lượt click</th>
                    <th className="text-right p-2">Chuyển đổi</th>
                    <th className="text-right p-2">Tìm kiếm</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.dailyData.map((day, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">
                        {new Date(day.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="text-right p-2">{day.views || 0}</td>
                      <td className="text-right p-2">{day.clicks || 0}</td>
                      <td className="text-right p-2">{day.conversions || 0}</td>
                      <td className="text-right p-2">{day.searches || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

