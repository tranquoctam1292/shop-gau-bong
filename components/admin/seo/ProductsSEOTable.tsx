'use client';

import { useState, useCallback, useMemo } from 'react';
import { useProductsSEO, useRunProductAudit, useBulkUpdateSEO, useRunFullAudit } from '@/lib/hooks/useSEO';
import { ProductSEORow, type ProductSEOData } from './ProductSEORow';
import { SEOScoreBadge } from './SEOScoreBadge';
import {
  Loader2,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsSEOTableProps {
  className?: string;
  onEditProduct?: (productId: string) => void;
}

type SortBy = 'score' | 'name' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export function ProductsSEOTable({
  className,
  onEditProduct,
}: ProductsSEOTableProps) {
  // State
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'excellent' | 'good' | 'needs_work' | 'poor'>('all');
  const [hasIssues, setHasIssues] = useState<boolean | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Score filter to min/max
  const scoreRange = useMemo(() => {
    switch (scoreFilter) {
      case 'excellent':
        return { scoreMin: 80, scoreMax: 100 };
      case 'good':
        return { scoreMin: 60, scoreMax: 79 };
      case 'needs_work':
        return { scoreMin: 40, scoreMax: 59 };
      case 'poor':
        return { scoreMin: 0, scoreMax: 39 };
      default:
        return { scoreMin: undefined, scoreMax: undefined };
    }
  }, [scoreFilter]);

  // Fetch data
  const { data, isLoading, error, refetch } = useProductsSEO({
    page,
    perPage,
    search: search || undefined,
    scoreMin: scoreRange.scoreMin,
    scoreMax: scoreRange.scoreMax,
    hasIssues,
    sortBy,
    sortOrder,
  });

  // Mutations
  const { mutate: runAudit, isPending: isAuditing } = useRunProductAudit();
  const { mutate: runFullAudit, isPending: isFullAuditing } = useRunFullAudit();
  const { mutate: bulkUpdate, isPending: isBulkUpdating } = useBulkUpdateSEO();

  // Handlers
  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleSort = useCallback((newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPage(1);
  }, [sortBy, sortOrder]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && data?.products) {
      setSelectedIds(new Set(data.products.map((p) => p._id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [data?.products]);

  const handleSelectOne = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleAuditSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    // Audit one by one
    selectedIds.forEach((productId) => {
      runAudit(productId);
    });
  }, [selectedIds, runAudit]);

  const handleAuditAll = useCallback(() => {
    runFullAudit(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  }, [runFullAudit, refetch]);

  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;
  const totalProducts = data?.total || 0;

  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p._id));
  const someSelected = products.some((p) => selectedIds.has(p._id));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tìm
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={scoreFilter}
            onChange={(e) => {
              setScoreFilter(e.target.value as typeof scoreFilter);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả điểm</option>
            <option value="excellent">Xuất sắc (80-100)</option>
            <option value="good">Tốt (60-79)</option>
            <option value="needs_work">Cần cải thiện (40-59)</option>
            <option value="poor">Kém (0-39)</option>
          </select>

          <select
            value={hasIssues === undefined ? 'all' : hasIssues ? 'yes' : 'no'}
            onChange={(e) => {
              const val = e.target.value;
              setHasIssues(val === 'all' ? undefined : val === 'yes');
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="yes">Có vấn đề</option>
            <option value="no">Không vấn đề</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAuditAll}
            disabled={isAuditing || isFullAuditing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isFullAuditing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Kiểm tra tất cả
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700">
            Đã chọn {selectedIds.size} sản phẩm
          </span>
          <button
            onClick={handleAuditSelected}
            disabled={isAuditing}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Kiểm tra SEO
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-blue-600 text-sm hover:bg-blue-100 rounded"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected;
            }}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <div className="w-12" /> {/* Image placeholder */}
          <button
            onClick={() => handleSort('name')}
            className="flex-1 text-left hover:text-gray-900 flex items-center gap-1"
          >
            Sản phẩm
            {sortBy === 'name' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('score')}
            className="w-20 text-center hover:text-gray-900 flex items-center justify-center gap-1"
          >
            Điểm
            {sortBy === 'score' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <div className="w-32 text-center">Vấn đề</div>
          <div className="w-20" /> {/* Actions */}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Lỗi khi tải dữ liệu
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy sản phẩm nào
          </div>
        ) : (
          <div>
            {products.map((product) => (
              <ProductSEORow
                key={product._id}
                product={product as ProductSEOData}
                isSelected={selectedIds.has(product._id)}
                onSelect={handleSelectOne}
                onEdit={onEditProduct}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <span className="text-sm text-gray-600">
              Hiển thị {(page - 1) * perPage + 1} -{' '}
              {Math.min(page * perPage, totalProducts)} / {totalProducts} sản phẩm
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsSEOTable;
