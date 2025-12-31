'use client';

import { SEODashboardStats } from '@/components/admin/seo';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function SEODashboardPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/admin" className="hover:text-gray-900 flex items-center gap-1">
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">SEO</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý SEO</h1>
          <p className="text-gray-500 mt-1">
            Tối ưu hóa SEO cho sản phẩm và cài đặt metadata
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <SEODashboardStats />
    </div>
  );
}
