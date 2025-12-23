'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, CheckSquare } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { ProductListTabs, type ProductListTab } from '@/components/admin/products/ProductListTabs';
import { ProductDataGrid } from '@/components/admin/products/ProductDataGrid';
import { ProductFilters } from '@/components/admin/products/ProductFilters';
import { BulkActionsBar } from '@/components/admin/products/BulkActionsBar';
import { useToastContext } from '@/components/providers/ToastProvider';
import { useProductFilters } from '@/lib/hooks/useProductFilters';
import { useProductSelectionStore } from '@/lib/store/productSelectionStore';

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToastContext();
  
  const [products, setProducts] = useState<MappedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  // ✅ PERFORMANCE: Sử dụng Zustand store để quản lý selection độc lập
  // Tránh re-render cả page khi chỉ một checkbox thay đổi
  const { 
    getSelectedIds, 
    clearSelection, 
    setSelection,
    getSelectedCount,
  } = useProductSelectionStore();
  // CRITICAL: Sử dụng useRef thay vì useState để tránh re-render loop
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set());
  
  // Get active tab from URL or default to 'all'
  const activeTab: ProductListTab = (searchParams.get('tab') as ProductListTab) || 'all';
  
  // Product filters
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useProductFilters();
  
  // Search state (separate from filters for debouncing)
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // CRITICAL: Sử dụng useRef để lưu updateFilter callback mới nhất
  // Tránh re-render loop khi updateFilter thay đổi reference
  const updateFilterRef = useRef(updateFilter);
  useEffect(() => {
    updateFilterRef.current = updateFilter;
  }, [updateFilter]);

  // CRITICAL: Debounce search to prevent race conditions
  // Sử dụng useRef để lưu timer, tránh re-render loop
  useEffect(() => {
    // Clear previous timer if exists
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    
    // Set new timer
    searchDebounceTimerRef.current = setTimeout(() => {
      setPage(1); // Reset to page 1 when search changes
      updateFilterRef.current('search', search || undefined);
    }, 300);
    
    // Cleanup function
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, [search]); // Removed updateFilter from dependencies - use ref instead

  // Reset page to 1 when filters change (except search which is handled separately)
  useEffect(() => {
    // Check if any filter (except search) has changed
    const hasFilterChanged = filters.category || filters.brand || 
                             filters.priceMin !== null || filters.priceMax !== null || 
                             filters.stockStatus;
    
    if (hasFilterChanged && page !== 1) {
      setPage(1);
      // Update URL to remove page param
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      router.push(`/admin/products?${params.toString()}`);
    }
  }, [filters.category, filters.brand, filters.priceMin, filters.priceMax, filters.stockStatus, page, searchParams, router]);

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: ProductListTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('page'); // Reset to page 1 when changing tab
    router.push(`/admin/products?${params.toString()}`);
  }, [searchParams, router]);

  // CRITICAL: Memoize fetchProducts với dependencies cụ thể thay vì toàn bộ filters object
  // Tránh re-render loop khi filters object thay đổi reference
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });

      // Add search (from filters or local search state)
      const searchValue = filters.search || search;
      if (searchValue) {
        params.append('search', searchValue);
      }

      // Add tab filters
      if (activeTab === 'trash') {
        params.append('trashed', 'true');
      } else if (activeTab === 'active') {
        params.append('status', 'publish');
      } else if (activeTab === 'outofstock') {
        params.append('stock_status', 'outofstock');
      }

      // Add advanced filters
      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.brand) {
        params.append('brand', filters.brand);
      }
      if (filters.priceMin !== null && filters.priceMin !== undefined) {
        params.append('price_min', filters.priceMin.toString());
      }
      if (filters.priceMax !== null && filters.priceMax !== undefined) {
        params.append('price_max', filters.priceMax.toString());
      }
      if (filters.stockStatus && activeTab !== 'outofstock') {
        params.append('stock_status', filters.stockStatus);
      }

      const response = await fetch(`/api/admin/products?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setTrashCount(data.filters?.trashCount || 0);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error : new Error('Không thể tải danh sách sản phẩm'));
      showToast('Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page, 
    activeTab, 
    filters.category, 
    filters.brand, 
    filters.priceMin, 
    filters.priceMax, 
    filters.stockStatus, 
    filters.search,
    search, 
    showToast
  ]);

  // Fetch products when page, tab, or filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // CRITICAL: Memoize all handlers với useCallback để tránh re-render loop
  // Các handlers này được truyền vào ProductDataGrid và các component con
  const handleDelete = useCallback(async (id: string) => {
    // Add to deleting set
    setDeletingProducts((prev) => new Set(prev).add(id));
    
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Đã chuyển vào thùng rác', 'success');
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Không thể xóa sản phẩm', 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Không thể xóa sản phẩm', 'error');
    } finally {
      // Remove from deleting set
      setDeletingProducts((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [showToast, fetchProducts]);

  const handleRestore = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/restore`, {
        method: 'PATCH',
      });

      if (response.ok) {
        showToast('Đã khôi phục sản phẩm', 'success');
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Không thể khôi phục sản phẩm', 'error');
      }
    } catch (error) {
      console.error('Error restoring product:', error);
      showToast('Không thể khôi phục sản phẩm', 'error');
    }
  }, [showToast, fetchProducts]);

  const handleForceDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/force`, {
        method: 'DELETE',
        credentials: 'include', // Include credentials for authentication
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message || 'Đã xóa vĩnh viễn sản phẩm', 'success');
        // Remove from selected products if it was selected (using store)
        const { toggleProduct } = useProductSelectionStore.getState();
        toggleProduct(id); // This will remove it if selected
        // Refresh product list
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        // Handle authentication errors
        if (response.status === 401) {
          showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        } else {
          showToast(errorData.error || 'Không thể xóa sản phẩm', 'error');
        }
      }
    } catch (error) {
      console.error('Error force deleting product:', error);
      showToast('Không thể xóa sản phẩm', 'error');
    }
  }, [showToast, fetchProducts]);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Đã tạo bản sao sản phẩm', 'success');
        fetchProducts();
      } else {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi tạo bản sao', 'error');
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      showToast('Có lỗi xảy ra khi tạo bản sao', 'error');
    }
  }, [showToast, fetchProducts]);

  // CRITICAL: Memoize handleStatusChange để tránh re-render loop
  // Đây là handler quan trọng nhất vì nó được truyền vào StatusCellWrapper
  const handleStatusChange = useCallback(async (id: string, status: 'draft' | 'publish') => {
    try {
      const response = await fetch(`/api/admin/products/${id}/quick-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        showToast('Đã cập nhật trạng thái', 'success');
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Không thể cập nhật trạng thái', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Không thể cập nhật trạng thái', 'error');
    }
  }, [showToast, fetchProducts]);

  // CRITICAL: Memoize handlers được truyền vào ProductDataGrid
  const handleProductUpdate = useCallback((updatedProduct: MappedProduct) => {
    // Optimistic update: update product in local state
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    // Refetch to ensure consistency
    fetchProducts();
  }, [fetchProducts]);

  // ✅ PERFORMANCE: Selection handlers đã được move vào Zustand store
  // Không cần local handlers nữa vì ProductDataGrid sử dụng store trực tiếp

  const handleBulkDelete = async () => {
    const selectedProducts = getSelectedIds();
    if (selectedProducts.length === 0) {
      showToast('Vui lòng chọn ít nhất một sản phẩm', 'warning');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/products/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedProducts,
          action: 'soft_delete',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message || `Đã xóa ${selectedProducts.length} sản phẩm`, 'success');
        clearSelection();
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Không thể xóa sản phẩm', 'error');
      }
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      showToast('Có lỗi xảy ra khi xóa sản phẩm', 'error');
    }
  };

  const handleBulkStatusChange = async (status: 'draft' | 'publish') => {
    const selectedProducts = getSelectedIds();
    if (selectedProducts.length === 0) {
      showToast('Vui lòng chọn ít nhất một sản phẩm', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/admin/products/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedProducts,
          action: 'update_status',
          value: status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message || `Đã cập nhật ${selectedProducts.length} sản phẩm`, 'success');
        clearSelection();
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Không thể cập nhật trạng thái', 'error');
      }
    } catch (error) {
      console.error('Error bulk updating status:', error);
      showToast('Có lỗi xảy ra khi cập nhật trạng thái', 'error');
    }
  };

  const handleBulkRestore = async () => {
    const selectedProducts = getSelectedIds();
    if (selectedProducts.length === 0) {
      showToast('Vui lòng chọn ít nhất một sản phẩm', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/admin/products/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedProducts,
          action: 'restore',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message || `Đã khôi phục ${selectedProducts.length} sản phẩm`, 'success');
        clearSelection();
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || 'Không thể khôi phục sản phẩm', 'error');
      }
    } catch (error) {
      console.error('Error bulk restoring products:', error);
      showToast('Có lỗi xảy ra khi khôi phục sản phẩm', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-2">Quản lý tất cả sản phẩm trong cửa hàng</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/bulk">
            <Button variant="outline">
              <CheckSquare className="w-4 h-4 mr-2" />
              Thao tác hàng loạt
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <ProductListTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            trashCount={trashCount}
          />
        </div>

        {/* Search Bar & Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Tìm kiếm sản phẩm, SKU, barcode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <ProductFilters
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={getSelectedCount()}
          isTrashTab={activeTab === 'trash'}
          onBulkDelete={handleBulkDelete}
          onBulkRestore={handleBulkRestore}
          onBulkForceDelete={async () => {
            const selectedProducts = getSelectedIds();
            if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn ${selectedProducts.length} sản phẩm?\n\nHành động này không thể hoàn tác!`)) {
              return;
            }
            try {
              const response = await fetch('/api/admin/products/bulk-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ids: selectedProducts,
                  action: 'force_delete',
                }),
              });
              if (response.ok) {
                const data = await response.json();
                showToast(data.message || `Đã xóa vĩnh viễn ${selectedProducts.length} sản phẩm`, 'success');
                clearSelection();
                fetchProducts();
              } else {
                const errorData = await response.json().catch(() => ({}));
                showToast(errorData.error || 'Không thể xóa sản phẩm', 'error');
              }
            } catch (error) {
              showToast('Có lỗi xảy ra khi xóa sản phẩm', 'error');
            }
          }}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkUpdatePrice={async (price: number) => {
            const selectedProducts = getSelectedIds();
            try {
              const response = await fetch('/api/admin/products/bulk-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ids: selectedProducts,
                  action: 'update_price',
                  value: price,
                }),
              });
              if (response.ok) {
                const data = await response.json();
                showToast(data.message || `Đã cập nhật giá cho ${selectedProducts.length} sản phẩm`, 'success');
                clearSelection();
                fetchProducts();
              } else {
                const errorData = await response.json().catch(() => ({}));
                showToast(errorData.error || 'Không thể cập nhật giá', 'error');
              }
            } catch (error) {
              showToast('Có lỗi xảy ra khi cập nhật giá', 'error');
            }
          }}
          onBulkUpdateStock={async (value: number, operation: 'set' | 'add' | 'subtract') => {
            const selectedProducts = getSelectedIds();
            try {
              // For add/subtract, we need to fetch current stock first
              // For now, we'll use a simplified approach: set to value for 'set', add/subtract for others
              // This would require additional API support for add/subtract operations
              // For now, we'll just set the stock value
              const response = await fetch('/api/admin/products/bulk-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ids: selectedProducts,
                  action: 'update_stock',
                  value: value, // For add/subtract, this would need to be calculated
                }),
              });
              if (response.ok) {
                const data = await response.json();
                showToast(data.message || `Đã cập nhật kho cho ${selectedProducts.length} sản phẩm`, 'success');
                clearSelection();
                fetchProducts();
              } else {
                const errorData = await response.json().catch(() => ({}));
                showToast(errorData.error || 'Không thể cập nhật kho', 'error');
              }
            } catch (error) {
              showToast('Có lỗi xảy ra khi cập nhật kho', 'error');
            }
          }}
          onClearSelection={clearSelection}
        />

        {/* Data Grid */}
        {/* ✅ PERFORMANCE: ProductDataGrid now uses Zustand store directly for selection */}
        {/* Props selectedProducts, onSelectProduct, onSelectAll are deprecated but kept for backward compatibility */}
        <ProductDataGrid
          products={products}
          loading={loading}
          error={error}
          isTrashTab={activeTab === 'trash'}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onForceDelete={handleForceDelete}
          onDuplicate={handleDuplicate}
          onStatusChange={handleStatusChange}
          onProductUpdate={handleProductUpdate}
          onRetry={fetchProducts}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => {
                setPage(page - 1);
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page - 1));
                router.push(`/admin/products?${params.toString()}`);
              }}
            >
              Trước
            </Button>
            <span className="px-4 py-2">
              Trang {page} / {totalPages} ({total} sản phẩm)
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => {
                setPage(page + 1);
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page + 1));
                router.push(`/admin/products?${params.toString()}`);
              }}
            >
              Sau
            </Button>
          </div>
        )}

        {/* Trash Warning */}
        {activeTab === 'trash' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Sản phẩm trong thùng rác sẽ tự động bị xóa sau 30 ngày
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
