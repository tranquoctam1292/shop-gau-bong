'use client';

import { CategoriesSEOTable } from '@/components/admin/seo/CategoriesSEOTable';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesSEOPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/admin/seo" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            SEO Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">SEO Categories</h1>
        <p className="text-gray-500 mt-1">
          Quản lý meta title và description cho các danh mục sản phẩm
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Hướng dẫn SEO Categories</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Meta Title:</strong> Tối đa 60-70 ký tự, chứa từ khóa chính</li>
          <li>• <strong>Meta Description:</strong> Tối đa 150-160 ký tự, mô tả hấp dẫn</li>
          <li>• Thay đổi sẽ được lưu tự động khi bạn rời khỏi ô nhập liệu</li>
          <li>• Nhấn "Lưu thay đổi" để lưu tất cả cùng lúc</li>
        </ul>
      </div>

      {/* Table */}
      <CategoriesSEOTable />
    </div>
  );
}
