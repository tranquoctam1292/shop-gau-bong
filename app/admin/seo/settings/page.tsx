'use client';

import { GlobalSEOForm } from '@/components/admin/seo';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function SEOSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/admin" className="hover:text-gray-900 flex items-center gap-1">
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/seo" className="hover:text-gray-900">
          SEO
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Cài đặt</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt SEO</h1>
          <p className="text-gray-500 mt-1">
            Cấu hình SEO toàn cục và thông tin Schema.org
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <GlobalSEOForm />
    </div>
  );
}
