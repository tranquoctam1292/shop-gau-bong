'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

interface MenuItem {
  id: string;
  title: string;
  type: 'custom' | 'category' | 'product' | 'page' | 'post';
  url: string | null;
  referenceId: string | null;
  target: '_self' | '_blank';
  iconClass: string | null;
  cssClass: string | null;
  order: number;
  parentId: string | null;
  children?: MenuItem[];
}

interface MenuItemsListProps {
  items: MenuItem[];
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

const TYPE_LABELS: Record<MenuItem['type'], string> = {
  custom: 'Tùy chỉnh',
  category: 'Danh mục',
  product: 'Sản phẩm',
  page: 'Trang',
  post: 'Bài viết',
};

const TYPE_COLORS: Record<MenuItem['type'], string> = {
  custom: 'bg-gray-100 text-gray-800',
  category: 'bg-blue-100 text-blue-800',
  product: 'bg-green-100 text-green-800',
  page: 'bg-purple-100 text-purple-800',
  post: 'bg-orange-100 text-orange-800',
};

export function MenuItemsList({ items, onDelete, onRefresh }: MenuItemsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa menu item này? Nếu có menu items con, chúng cũng sẽ bị xóa.')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete?.(id);
      await onRefresh?.();
    } catch (err) {
      // Error handled in parent
    } finally {
      setDeletingId(null);
    }
  };

  const getIndentLevel = (item: MenuItem): number => {
    if (!item.parentId) return 0;
    const parent = items.find((i) => i.id === item.parentId);
    if (!parent) return 0;
    return getIndentLevel(parent) + 1;
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có menu item nào"
        description="Bắt đầu bằng cách thêm menu item đầu tiên vào menu này."
        icon="📋"
      />
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const indentLevel = getIndentLevel(item);
        const isDeleting = deletingId === item.id;

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            style={{ paddingLeft: `${16 + indentLevel * 24}px` }}
          >
            {/* Title & Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900">{item.title}</span>
                <Badge className={TYPE_COLORS[item.type]} variant="secondary">
                  {TYPE_LABELS[item.type]}
                </Badge>
                {item.target === '_blank' && (
                  <Badge variant="outline" className="text-xs">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Mở tab mới
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                {item.url && (
                  <span className="truncate">{item.url}</span>
                )}
                {item.referenceId && (
                  <span className="text-xs">(ID: {item.referenceId.substring(0, 8)}...)</span>
                )}
              </div>
            </div>

            {/* Order */}
            <div className="text-sm text-gray-500 min-w-[60px] text-right">
              Thứ tự: {item.order}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isDeleting}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/menus/items/${item.id}/edit`} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(item.id)}
                  className="cursor-pointer text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}

