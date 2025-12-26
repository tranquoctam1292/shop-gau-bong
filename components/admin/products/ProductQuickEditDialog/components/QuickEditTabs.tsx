'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickEditHistoryTab } from './QuickEditHistoryTab';
import { QuickEditComparisonTab } from './QuickEditComparisonTab';
import type { QuickEditFormData } from '../types';

export interface QuickEditTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isBulkMode: boolean;
  productId?: string;
  historyPage: number;
  onHistoryPageChange: (page: number) => void;
  snapshotInitialData: QuickEditFormData | null;
  productName?: string;
  editContent: React.ReactNode;
}

export const QuickEditTabs = React.memo<QuickEditTabsProps>(({
  activeTab,
  onTabChange,
  isBulkMode,
  productId,
  historyPage,
  onHistoryPageChange,
  snapshotInitialData,
  productName,
  editContent,
}) => {
  // Don't show tabs in bulk mode
  if (isBulkMode) {
    return <>{editContent}</>;
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="edit" className="min-h-[44px]">
          Chỉnh sửa
        </TabsTrigger>
        <TabsTrigger value="history" className="min-h-[44px]">
          Lịch sử
        </TabsTrigger>
        <TabsTrigger value="comparison" className="min-h-[44px]">
          So sánh
        </TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-0">
        {editContent}
      </TabsContent>
      <TabsContent value="history" className="mt-0">
        <QuickEditHistoryTab
          productId={productId}
          page={historyPage}
          onPageChange={onHistoryPageChange}
          enabled={activeTab === 'history'}
        />
      </TabsContent>
      <TabsContent value="comparison" className="mt-0">
        <QuickEditComparisonTab
          snapshotInitialData={snapshotInitialData}
          productId={productId}
          productName={productName}
        />
      </TabsContent>
    </Tabs>
  );
});

QuickEditTabs.displayName = 'QuickEditTabs';

