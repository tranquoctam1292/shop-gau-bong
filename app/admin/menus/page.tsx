'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';
import { MenuListTable } from '@/components/admin/menus/MenuListTable';
import { MenuFilters } from '@/components/admin/menus/MenuFilters';
import { DeleteMenuConfirmDialog } from '@/components/admin/menus/DeleteMenuConfirmDialog';

interface Menu {
  id: string;
  name: string;
  location: string | null;
  status: 'active' | 'inactive';
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuFiltersState {
  location: string | null;
  status: 'active' | 'inactive' | 'all';
  search: string;
}

export default function AdminMenusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToastContext();
  
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<MenuFiltersState>({
    location: searchParams.get('location') || null,
    status: (searchParams.get('status') as MenuFiltersState['status']) || 'all',
    search: searchParams.get('search') || '',
  });

  // Debounce search
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      setPage(1);
      const params = new URLSearchParams(searchParams.toString());
      if (filters.search) {
        params.set('search', filters.search);
      } else {
        params.delete('search');
      }
      params.delete('page');
      router.push(`/admin/menus?${params.toString()}`);
    }, 300);
    
    setSearchDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [filters.search]);

  // Fetch menus when page or filters change
  useEffect(() => {
    fetchMenus();
  }, [page, filters.location, filters.status]);

  // Sync URL params to filters
  useEffect(() => {
    setFilters({
      location: searchParams.get('location') || null,
      status: (searchParams.get('status') as MenuFiltersState['status']) || 'all',
      search: searchParams.get('search') || '',
    });
  }, [searchParams]);

  const fetchMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });

      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.location) {
        params.append('location', filters.location);
      }
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await fetch(`/api/admin/menus?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch menus');
      }

      const data = await response.json();
      setMenus(data.menus || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      console.error('Error fetching menus:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch menus'));
      showToast('Không thể tải danh sách menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    const menu = menus.find((m) => m.id === id);
    if (menu) {
      setMenuToDelete(menu);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!menuToDelete) return;

    try {
      const response = await fetch(`/api/admin/menus/${menuToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete menu');
      }

      showToast('Đã xóa menu thành công', 'success');
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
      fetchMenus();
    } catch (err: any) {
      console.error('Error deleting menu:', err);
      showToast('Không thể xóa menu', 'error');
    }
  };

  const updateFilter = useCallback((key: keyof MenuFiltersState, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      const params = new URLSearchParams(searchParams.toString());
      
      if (value === null || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      params.delete('page');
      router.push(`/admin/menus?${params.toString()}`);
      
      return newFilters;
    });
  }, [router, searchParams]);

  const clearFilters = useCallback(() => {
    setFilters({
      location: null,
      status: 'all',
      search: '',
    });
    const params = new URLSearchParams();
    params.delete('page');
    router.push(`/admin/menus?${params.toString()}`);
  }, [router]);

  const hasActiveFilters = filters.location !== null || filters.status !== 'all' || filters.search !== '';

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Menu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các menu điều hướng trên website
          </p>
        </div>
        <Link href="/admin/menus/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo menu mới
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm menu..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-9"
          />
        </div>
        <MenuFilters
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Menu List Table */}
      <MenuListTable
        menus={menus}
        loading={loading}
        error={error}
        onDelete={handleDeleteClick}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMenuConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setMenuToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        menuName={menuToDelete?.name || ''}
        itemCount={menuToDelete?.itemCount || 0}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 items-center">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => {
              setPage(page - 1);
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(page - 1));
              router.push(`/admin/menus?${params.toString()}`);
            }}
          >
            Trước
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Trang {page} / {totalPages} ({total} menu)
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => {
              setPage(page + 1);
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', String(page + 1));
              router.push(`/admin/menus?${params.toString()}`);
            }}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}

