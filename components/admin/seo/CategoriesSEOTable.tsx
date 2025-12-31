'use client';

import { useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Save,
  FolderTree,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface CategorySEOItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  seo: {
    metaTitle?: string;
    metaDesc?: string;
  };
  productCount: number;
  status: string;
  updatedAt: Date;
}

interface CategoriesResponse {
  categories: CategorySEOItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface CategoryUpdate {
  categoryId: string;
  seo: {
    metaTitle?: string;
    metaDesc?: string;
  };
}

// API functions
async function fetchCategoriesSEO(params: {
  page: number;
  perPage: number;
  search?: string;
}): Promise<CategoriesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('per_page', String(params.perPage));
  if (params.search) searchParams.set('search', params.search);

  const response = await fetch(`/api/admin/seo/categories?${searchParams}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Lỗi khi tải danh sách categories');
  }

  return response.json();
}

async function updateCategoriesSEO(updates: CategoryUpdate[]): Promise<void> {
  const response = await fetch('/api/admin/seo/categories', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi cập nhật SEO');
  }
}

// Inline editor row
const CategoryRow = memo(function CategoryRow({
  category,
  onUpdate,
}: {
  category: CategorySEOItem;
  onUpdate: (id: string, seo: { metaTitle?: string; metaDesc?: string }) => void;
}) {
  const [metaTitle, setMetaTitle] = useState(category.seo.metaTitle || '');
  const [metaDesc, setMetaDesc] = useState(category.seo.metaDesc || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleTitleChange = (value: string) => {
    setMetaTitle(value);
    setIsDirty(true);
  };

  const handleDescChange = (value: string) => {
    setMetaDesc(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (isDirty) {
      onUpdate(category._id, { metaTitle, metaDesc });
      setIsDirty(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
              <FolderTree className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{category.name}</p>
            <p className="text-xs text-gray-500">/{category.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-gray-600">
        {category.productCount}
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={handleSave}
          placeholder="Meta title..."
          maxLength={70}
          className={cn(
            'w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500',
            metaTitle.length > 60 ? 'border-yellow-400' : 'border-gray-200'
          )}
        />
        <span className={cn(
          'text-xs',
          metaTitle.length > 60 ? 'text-yellow-600' : 'text-gray-400'
        )}>
          {metaTitle.length}/70
        </span>
      </td>
      <td className="px-4 py-3">
        <textarea
          value={metaDesc}
          onChange={(e) => handleDescChange(e.target.value)}
          onBlur={handleSave}
          placeholder="Meta description..."
          maxLength={160}
          rows={2}
          className={cn(
            'w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 resize-none',
            metaDesc.length > 150 ? 'border-yellow-400' : 'border-gray-200'
          )}
        />
        <span className={cn(
          'text-xs',
          metaDesc.length > 150 ? 'text-yellow-600' : 'text-gray-400'
        )}>
          {metaDesc.length}/160
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {isDirty && (
          <button
            onClick={handleSave}
            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
            title="Lưu"
          >
            <Save className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
});

// Main component
function CategoriesSEOTableComponent({ className }: { className?: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, CategoryUpdate>>(new Map());

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['seo', 'categories', { page, search }],
    queryFn: () => fetchCategoriesSEO({ page, perPage: 15, search: search || undefined }),
    staleTime: 30 * 1000,
  });

  const { mutate: saveUpdates, isPending: isSaving } = useMutation({
    mutationFn: updateCategoriesSEO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo', 'categories'] });
      setPendingUpdates(new Map());
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleUpdate = useCallback((id: string, seo: { metaTitle?: string; metaDesc?: string }) => {
    setPendingUpdates(prev => {
      const next = new Map(prev);
      next.set(id, { categoryId: id, seo });
      return next;
    });
  }, []);

  const handleSaveAll = () => {
    if (pendingUpdates.size > 0) {
      saveUpdates(Array.from(pendingUpdates.values()));
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
        <p className="text-red-500">Lỗi khi tải danh sách categories</p>
      </div>
    );
  }

  const categories = data?.categories || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm category..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Tìm
          </button>
        </form>

        {pendingUpdates.size > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu {pendingUpdates.size} thay đổi
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Category</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700 w-20">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 w-1/4">Meta Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 w-1/3">Meta Description</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'Không tìm thấy category nào' : 'Chưa có category nào'}
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <CategoryRow
                    key={category._id}
                    category={category}
                    onUpdate={handleUpdate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-600">
              Tổng: {total} categories
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

export const CategoriesSEOTable = memo(CategoriesSEOTableComponent);
export default CategoriesSEOTable;
