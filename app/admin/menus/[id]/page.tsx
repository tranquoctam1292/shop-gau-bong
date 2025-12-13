'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';
import { MenuEditorHeader } from '@/components/admin/menus/MenuEditorHeader';
import { MenuStructurePanel } from '@/components/admin/menus/MenuStructurePanel';
import { MenuItemsSourcePanel } from '@/components/admin/menus/MenuItemsSourcePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Menu {
  id: string;
  name: string;
  location: string | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

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
  // FIX: Include referenceStatus from backend to avoid N+1 API calls
  referenceStatus?: {
    exists: boolean;
    active: boolean;
    url: string;
    title: string;
  };
}

export default function MenuEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { showToast } = useToastContext();
  const { id } = params;
  
  const [menu, setMenu] = useState<Menu | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchMenu();
    fetchMenuItems();
  }, [id]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/admin/menus/${id}?format=tree`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch menu');
      }

      const data = await response.json();
      setMenu({
        id: data.menu._id,
        name: data.menu.name,
        location: data.menu.location || null,
        status: data.menu.status,
        createdAt: new Date(data.menu.createdAt),
        updatedAt: new Date(data.menu.updatedAt),
      });
    } catch (err: any) {
      console.error('Error fetching menu:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch menu'));
      showToast('Không thể tải thông tin menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/admin/menus/${id}?format=tree`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch menu items');
      }

      const data = await response.json();
      // Convert tree structure to flat list for MenuStructurePanel
      const flattenItems = (items: any[], parentId: string | null = null): MenuItem[] => {
        const result: MenuItem[] = [];
        items.forEach((item) => {
          result.push({
            id: item.id,
            title: item.title,
            type: item.type,
            url: item.url,
            referenceId: item.referenceId,
            target: item.target,
            iconClass: item.iconClass,
            cssClass: item.cssClass,
            order: item.order,
            parentId: parentId,
            // FIX: Preserve referenceStatus from backend API
            referenceStatus: item.referenceStatus,
          });
          if (item.children && item.children.length > 0) {
            result.push(...flattenItems(item.children, item.id));
          }
        });
        return result;
      };
      
      setMenuItems(flattenItems(data.menu.items || []));
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
    }
  };

  const handleMenuUpdate = async (updates: Partial<Menu>) => {
    try {
      const response = await fetch(`/api/admin/menus/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update menu');
      }

      const data = await response.json();
      setMenu({
        id: data.menu._id,
        name: data.menu.name,
        location: data.menu.location || null,
        status: data.menu.status,
        createdAt: new Date(data.menu.createdAt),
        updatedAt: new Date(data.menu.updatedAt),
      });
      showToast('Cập nhật menu thành công', 'success');
    } catch (err: any) {
      console.error('Error updating menu:', err);
      showToast('Không thể cập nhật menu', 'error');
    }
  };

  const handleMenuItemDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/menu-items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete menu item');
      }

      showToast('Đã xóa menu item thành công', 'success');
      fetchMenuItems();
    } catch (err: any) {
      console.error('Error deleting menu item:', err);
      showToast(err.message || 'Không thể xóa menu item', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">
            {error?.message || 'Menu không tồn tại'}
          </p>
          <Link href="/admin/menus">
            <Button variant="outline">Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/menus">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa menu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý menu items và cấu hình menu
          </p>
        </div>
      </div>

      {/* Menu Editor Header */}
      <MenuEditorHeader
        menu={menu}
        onUpdate={handleMenuUpdate}
      />

      {/* Two Column Layout: Source Panel + Menu Items */}
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left: Source Panel */}
        {/* Mobile: Show at bottom, Desktop: Show on left */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base lg:text-lg">Thêm menu items</CardTitle>
              <CardDescription className="text-sm">
                Chọn items từ các nguồn để thêm vào menu
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <MenuItemsSourcePanel
                menuId={id}
                onItemsAdded={fetchMenuItems}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Menu Items List */}
        {/* Mobile: Show at top, Desktop: Show on right */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base lg:text-lg">Menu Items</CardTitle>
                  <CardDescription className="text-sm">
                    Kéo thả để sắp xếp thứ tự và cấp bậc của menu items
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <MenuStructurePanel
                menuId={id}
                items={menuItems}
                onDelete={handleMenuItemDelete}
                onRefresh={fetchMenuItems}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

