'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';
import { PagesTab } from './tabs/PagesTab';
import { CategoriesTab } from './tabs/CategoriesTab';
import { ProductsTab } from './tabs/ProductsTab';
import { PostsTab } from './tabs/PostsTab';
import { CustomLinkTab } from './tabs/CustomLinkTab';

interface MenuItemsSourcePanelProps {
  menuId: string;
  onItemsAdded?: () => void;
}

type SourceTab = 'pages' | 'categories' | 'products' | 'posts' | 'custom';

interface SelectedItem {
  id: string;
  type: 'page' | 'category' | 'product' | 'post' | 'custom';
  title: string;
  url?: string;
  referenceId?: string;
}

export function MenuItemsSourcePanel({ menuId, onItemsAdded }: MenuItemsSourcePanelProps) {
  const { showToast } = useToastContext();
  const [activeTab, setActiveTab] = useState<SourceTab>('pages');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const handleAddToMenu = async () => {
    if (selectedItems.length === 0) {
      showToast('Vui lòng chọn ít nhất một item để thêm vào menu', 'error');
      return;
    }

    setLoading(true);
    try {
      // Get current max order for this menu
      const menuResponse = await fetch(`/api/admin/menus/${menuId}?format=flat`);
      const menuData = await menuResponse.json();
      const existingItems = menuData.menu?.items || [];
      const maxOrder = existingItems.length > 0
        ? Math.max(...existingItems.map((item: any) => item.order || 0))
        : -1;

      // Create menu items sequentially
      const promises = selectedItems.map((item, index) => {
        const menuItemData: any = {
          menuId,
          title: item.title,
          type: item.type,
          target: '_self',
          order: maxOrder + 1 + index,
        };

        if (item.type === 'custom') {
          menuItemData.url = item.url || '#';
        } else if (item.type === 'page') {
          // Pages are hardcoded, use URL instead of referenceId
          menuItemData.url = item.url || '#';
          // For pages, we don't use referenceId since they're hardcoded
        } else {
          // For categories, products, posts - use referenceId
          const referenceId = item.referenceId || item.id;
          // Validate ObjectId format
          if (!referenceId || !/^[0-9a-fA-F]{24}$/.test(referenceId)) {
            throw new Error(`Invalid reference ID for ${item.type}: ${referenceId}`);
          }
          menuItemData.referenceId = referenceId;
        }

        return fetch('/api/admin/menu-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(menuItemData),
        });
      });

      const responses = await Promise.all(promises);
      const errors = responses.filter((r) => !r.ok);

      if (errors.length > 0) {
        const errorData = await errors[0].json();
        throw new Error(errorData.error || 'Failed to add some items');
      }

      showToast(`Đã thêm ${selectedItems.length} item(s) vào menu`, 'success');
      setSelectedItems([]);
      onItemsAdded?.();
    } catch (err: any) {
      console.error('Error adding items to menu:', err);
      showToast(err.message || 'Không thể thêm items vào menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item: SelectedItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id && i.type === item.type);
      if (exists) {
        return prev.filter((i) => !(i.id === item.id && i.type === item.type));
      }
      return [...prev, item];
    });
  };

  const handleItemDeselect = (itemId: string, type: SelectedItem['type']) => {
    setSelectedItems((prev) =>
      prev.filter((i) => !(i.id === itemId && i.type === type))
    );
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const selectedCount = selectedItems.length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SourceTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pages">Trang</TabsTrigger>
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="posts">Bài viết</TabsTrigger>
          <TabsTrigger value="custom">Tùy chỉnh</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4">
          <PagesTab
            selectedItems={selectedItems.filter((i) => i.type === 'page')}
            onItemSelect={handleItemSelect}
            onItemDeselect={handleItemDeselect}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesTab
            selectedItems={selectedItems.filter((i) => i.type === 'category')}
            onItemSelect={handleItemSelect}
            onItemDeselect={handleItemDeselect}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductsTab
            selectedItems={selectedItems.filter((i) => i.type === 'product')}
            onItemSelect={handleItemSelect}
            onItemDeselect={handleItemDeselect}
          />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <PostsTab
            selectedItems={selectedItems.filter((i) => i.type === 'post')}
            onItemSelect={handleItemSelect}
            onItemDeselect={handleItemDeselect}
          />
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <CustomLinkTab
            selectedItems={selectedItems.filter((i) => i.type === 'custom')}
            onItemSelect={handleItemSelect}
            onItemDeselect={handleItemDeselect}
          />
        </TabsContent>
      </Tabs>

      {/* Add to Menu Button */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="text-sm">
            <span className="font-medium">{selectedCount}</span> item(s) đã chọn
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={loading}
            >
              Bỏ chọn tất cả
            </Button>
            <Button
              onClick={handleAddToMenu}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm vào menu ({selectedCount})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

