'use client';

import { useState, memo } from 'react';
import { useSEORedirects, useDeleteRedirect, useUpdateRedirect } from '@/lib/hooks/useSEO';
import type { SEORedirect } from '@/types/seo';
import {
  Loader2,
  Trash2,
  Edit2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RedirectsTableProps {
  onEdit?: (redirect: SEORedirect) => void;
  className?: string;
}

function RedirectsTableComponent({ onEdit, className }: RedirectsTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error } = useSEORedirects({
    page,
    perPage: 15,
    search: search || undefined,
    enabled: enabledFilter,
  });

  const { mutate: deleteRedirect, isPending: isDeleting } = useDeleteRedirect();
  const { mutate: updateRedirect, isPending: isUpdating } = useUpdateRedirect();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleEnabled = (redirect: SEORedirect) => {
    if (!redirect._id) return;
    updateRedirect({
      id: redirect._id,
      data: { enabled: !redirect.enabled },
    });
  };

  const handleDelete = (redirect: SEORedirect) => {
    if (!redirect._id) return;
    if (confirm(`Xóa redirect "${redirect.source}"?`)) {
      deleteRedirect(redirect._id);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
        <p className="text-red-500">Lỗi khi tải danh sách redirects</p>
      </div>
    );
  }

  const redirects = data?.redirects || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo source hoặc destination..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Tìm
          </button>
        </form>

        <select
          value={enabledFilter === undefined ? '' : String(enabledFilter)}
          onChange={(e) => {
            const val = e.target.value;
            setEnabledFilter(val === '' ? undefined : val === 'true');
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã tắt</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Destination</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Hits</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {redirects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'Không tìm thấy redirect nào' : 'Chưa có redirect nào'}
                  </td>
                </tr>
              ) : (
                redirects.map((redirect) => (
                  <tr key={redirect._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {redirect.source}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 truncate max-w-[200px]">
                          {redirect.destination}
                        </span>
                        {redirect.destination.startsWith('http') && (
                          <a
                            href={redirect.destination}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          redirect.type === 301
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        )}
                      >
                        {redirect.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {redirect.hitCount || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleEnabled(redirect)}
                        disabled={isUpdating}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        title={redirect.enabled ? 'Tắt redirect' : 'Bật redirect'}
                      >
                        {redirect.enabled ? (
                          <ToggleRight className="h-6 w-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(redirect)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="Sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(redirect)}
                          disabled={isDeleting}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-600">
              Tổng: {total} redirects
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const RedirectsTable = memo(RedirectsTableComponent);
export default RedirectsTable;
