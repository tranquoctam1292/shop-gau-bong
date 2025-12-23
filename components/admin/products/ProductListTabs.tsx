'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ProductListTab = 'all' | 'active' | 'outofstock' | 'trash';

interface ProductListTabsProps {
  activeTab: ProductListTab;
  onTabChange: (tab: ProductListTab) => void;
  trashCount?: number;
}

export function ProductListTabs({
  activeTab,
  onTabChange,
  trashCount = 0,
}: ProductListTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ProductListTab)}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">Tất cả</TabsTrigger>
        <TabsTrigger value="active">Đang bán</TabsTrigger>
        <TabsTrigger value="outofstock">Hết hàng</TabsTrigger>
        <TabsTrigger value="trash">
          Thùng rác {trashCount > 0 && `(${trashCount})`}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

