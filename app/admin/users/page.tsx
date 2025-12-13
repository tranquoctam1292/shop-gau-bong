/**
 * Admin Users List Page
 * 
 * Displays list of admin users with pagination, search, and filters
 * Only accessible by SUPER_ADMIN
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Key, LogOut } from 'lucide-react';
import { useAdminUsers, useDeleteAdminUser } from '@/lib/hooks/useAdminUsers';
import { AdminRole } from '@/types/admin';
import { ROLE_DISPLAY_NAMES } from '@/lib/constants/adminRoles';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { useToastContext } from '@/components/providers/ToastProvider';

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToastContext();

  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState<AdminRole | 'all'>(
    (searchParams.get('role') as AdminRole) || 'all'
  );
  const [activeFilter, setActiveFilter] = useState<string>(
    searchParams.get('is_active') || 'all'
  );

  const { data, isLoading, error, refetch } = useAdminUsers({
    page,
    limit: 20,
    search: search || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    is_active: activeFilter !== 'all' ? activeFilter === 'true' : undefined,
  });

  const deleteMutation = useDeleteAdminUser();

  // Define updateURL function first (before using in useEffect)
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (activeFilter !== 'all') params.set('is_active', activeFilter);
    router.replace(`/admin/users?${params.toString()}`);
  }, [page, search, roleFilter, activeFilter, router]);

  // CRITICAL FIX: Debounce search to prevent API spam
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParams.get('search')) {
        setPage(1); // Reset to page 1 when search changes
        updateURL();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchParams, updateURL]);

  // Update URL when filters change
  useEffect(() => {
    updateURL();
  }, [page, roleFilter, activeFilter, updateURL]);

  // CRITICAL FIX: Sync state with URL params (for browser back/forward)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    const urlSearch = searchParams.get('search') || '';
    const urlRole = (searchParams.get('role') as AdminRole) || 'all';
    const urlActive = searchParams.get('is_active') || 'all';

    if (urlPage !== page) setPage(urlPage);
    if (urlSearch !== search) setSearch(urlSearch);
    if (urlRole !== roleFilter) setRoleFilter(urlRole);
    if (urlActive !== activeFilter) setActiveFilter(urlActive);
  }, [searchParams]); // Sync when URL changes

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Bạn có chắc muốn vô hiệu hóa người dùng "${username}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(userId);
      showToast('Đã vô hiệu hóa người dùng thành công', 'success');
      refetch();
    } catch (error: any) {
      showToast(error.message || 'Đã xảy ra lỗi', 'error');
    }
  };

  const handleResetPassword = (userId: string) => {
    router.push(`/admin/users/${userId}/reset-password`);
  };

  const handleForceLogout = async (userId: string, username: string) => {
    if (!confirm(`Bạn có chắc muốn đăng xuất người dùng "${username}" khỏi tất cả thiết bị?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/force-logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to force logout');
      }

      showToast('Đã đăng xuất người dùng khỏi tất cả thiết bị', 'success');
    } catch (error: any) {
      showToast(error.message || 'Đã xảy ra lỗi', 'error');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Lỗi: {(error as Error).message}</div>
      </div>
    );
  }

  const users = data?.data?.users || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  return (
    <PermissionGuard role={AdminRole.SUPER_ADMIN}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý tài khoản Admin</h1>
          <Link href="/admin/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo người dùng mới
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, email, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AdminRole | 'all')}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {Object.entries(ROLE_DISPLAY_NAMES).map(([role, label]) => (
                <SelectItem key={role} value={role}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="true">Đang hoạt động</SelectItem>
              <SelectItem value="false">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Không có người dùng nào</div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tên đầy đủ</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đăng nhập cuối</TableHead>
                    <TableHead className="w-[100px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{ROLE_DISPLAY_NAMES[user.role]}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                        {user.must_change_password && (
                          <span className="ml-2 px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                            Cần đổi mật khẩu
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString('vi-VN')
                          : 'Chưa đăng nhập'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user._id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user._id)}>
                              <Key className="h-4 w-4 mr-2" />
                              Reset mật khẩu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleForceLogout(user._id, user.username)}>
                              <LogOut className="h-4 w-4 mr-2" />
                              Đăng xuất tất cả thiết bị
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(user._id, user.username)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Vô hiệu hóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Hiển thị {users.length} / {total} người dùng
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PermissionGuard>
  );
}
