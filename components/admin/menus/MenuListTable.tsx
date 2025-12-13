'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, FilterX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Menu {
  id: string;
  name: string;
  location: string | null;
  status: 'active' | 'inactive';
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuListTableProps {
  menus: Menu[];
  loading?: boolean;
  error?: Error | null;
  onDelete?: (id: string) => Promise<void>;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function MenuListTable({
  menus,
  loading = false,
  error = null,
  onDelete,
  hasActiveFilters = false,
  onClearFilters,
}: MenuListTableProps) {
  if (error) {
    return (
      <ErrorState
        message={error.message || 'Không thể tải danh sách menu.'}
        action={{
          label: 'Thử lại',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]"><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead className="min-w-[150px]"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="min-w-[100px]"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="min-w-[100px]"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="min-w-[150px]"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="w-[80px] text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (menus.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          title="Không tìm thấy menu nào"
          description="Thử thay đổi bộ lọc hoặc xóa tất cả bộ lọc để xem thêm menu."
          icon={<FilterX className="w-16 h-16 text-gray-400" />}
          action={onClearFilters ? { label: 'Xóa bộ lọc', onClick: onClearFilters } : undefined}
        />
      );
    }
    return (
      <EmptyState
        title="Chưa có menu nào"
        description="Bắt đầu bằng cách tạo menu mới để quản lý điều hướng trên website."
        icon="📋"
        action={{ label: 'Tạo menu mới', href: '/admin/menus/new' }}
      />
    );
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Tên menu</TableHead>
            <TableHead className="min-w-[150px]">Vị trí</TableHead>
            <TableHead className="min-w-[100px]">Trạng thái</TableHead>
            <TableHead className="min-w-[100px]">Số items</TableHead>
            <TableHead className="min-w-[150px]">Cập nhật</TableHead>
            <TableHead className="w-[80px] text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {menus.map((menu) => (
            <TableRow key={menu.id}>
              <TableCell>
                <Link
                  href={`/admin/menus/${menu.id}`}
                  className="font-medium text-gray-900 hover:text-primary transition-colors"
                >
                  {menu.name}
                </Link>
              </TableCell>
              <TableCell>
                {menu.location ? (
                  <Badge variant="outline">{menu.location}</Badge>
                ) : (
                  <span className="text-gray-400 text-sm">Chưa gán</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={menu.status === 'active' ? 'default' : 'secondary'}
                >
                  {menu.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">{menu.itemCount}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-500">{formatDate(menu.updatedAt)}</span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/menus/${menu.id}`} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(menu.id)}
                      className="cursor-pointer text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

