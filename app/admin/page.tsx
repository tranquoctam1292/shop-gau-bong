'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, FolderTree, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    categories: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, ordersRes, categoriesRes] = await Promise.all([
          fetch('/api/admin/products?per_page=1'),
          fetch('/api/admin/orders?per_page=1'),
          fetch('/api/admin/categories'),
        ]);

        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();
        const categoriesData = await categoriesRes.json();

        setStats({
          products: productsData.pagination?.total || 0,
          orders: ordersData.pagination?.total || 0,
          categories: categoriesData.categories?.length || 0,
          revenue: 0, // TODO: Calculate from orders
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  const statCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats.products,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.orders,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Danh mục',
      value: stats.categories,
      icon: FolderTree,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Doanh thu',
      value: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(stats.revenue),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Chào mừng, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
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
    </div>
  );
}

