'use client';

import { useState } from 'react';
import { RedirectsTable } from '@/components/admin/seo/RedirectsTable';
import { RedirectForm } from '@/components/admin/seo/RedirectForm';
import type { SEORedirect } from '@/types/seo';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RedirectsPage() {
  const [editingRedirect, setEditingRedirect] = useState<SEORedirect | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (redirect: SEORedirect) => {
    setEditingRedirect(redirect);
    setShowForm(true);
  };

  const handleClose = () => {
    setEditingRedirect(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    setEditingRedirect(null);
    setShowForm(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/seo" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              SEO Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Redirects</h1>
          <p className="text-gray-500 mt-1">
            Tạo và quản lý các redirect 301/302 cho website
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm redirect
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Lưu ý về Redirects</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>301 (Permanent):</strong> Sử dụng khi trang đã di chuyển vĩnh viễn. Tốt cho SEO.</li>
          <li>• <strong>302 (Temporary):</strong> Sử dụng cho redirect tạm thời. Không chuyển SEO juice.</li>
          <li>• Redirects được xử lý bởi middleware và có cache để tối ưu hiệu năng.</li>
          <li>• Tránh tạo redirect loops (A → B → A).</li>
        </ul>
      </div>

      {/* Form (conditional) */}
      {showForm && (
        <div className="mb-6">
          <RedirectForm redirect={editingRedirect} onClose={handleClose} />
        </div>
      )}

      {/* Table */}
      <RedirectsTable onEdit={handleEdit} />
    </div>
  );
}
