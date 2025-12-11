'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TopControlBar } from './TopControlBar';
import { TabNavigation } from './TabNavigation';
import { GeneralTab } from './GeneralTab';
import { InventoryTab } from './InventoryTab';
import { ShippingTab } from './ShippingTab';
import { LinkedProductsTab } from './LinkedProductsTab';
import { AttributesTab } from './AttributesTab';
import { VariationsTab } from './VariationsTab';
import { AdvancedTab } from './AdvancedTab';

export type ProductType = 'simple' | 'variable' | 'grouped' | 'external';

export interface ProductDataMetaBoxState {
  // Product Type & Options
  productType: ProductType;
  isVirtual: boolean;
  isDownloadable: boolean;

  // General Tab
  costPrice?: number;
  regularPrice?: number;
  salePrice?: number;
  salePriceStartDate?: string;
  salePriceEndDate?: string;
  downloadableFiles?: Array<{
    id: string;
    name: string;
    url: string;
    downloadLimit?: number;
    downloadExpiry?: string;
  }>;

  // Inventory Tab
  sku?: string;
  manageStock: boolean;
  stockQuantity?: number;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  lowStockThreshold?: number;
  backorders: 'no' | 'notify' | 'yes';
  soldIndividually: boolean;

  // Shipping Tab
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  shippingClass?: string;

  // Linked Products
  upsellIds: string[];
  crossSellIds: string[];

  // Attributes
  attributes: Array<{
    id: string;
    name: string;
    isGlobal: boolean;
    values: string[];
    usedForVariations: boolean;
    colorCodes?: Record<string, string>; // For color attributes
  }>;

  // Variations
  variations: Array<{
    id: string;
    name: string;
    sku?: string;
    costPrice?: number;
    regularPrice?: number;
    salePrice?: number;
    stockQuantity?: number;
    image?: string;
    attributes: Record<string, string>; // attribute name -> value
  }>;

  // Advanced
  purchaseNote?: string;
  menuOrder: number;
  enableReviews: boolean;
}

interface ProductDataMetaBoxProps {
  data?: Partial<ProductDataMetaBoxState>;
  onChange?: (data: ProductDataMetaBoxState) => void;
  productId?: string; // For SKU validation
}

/**
 * Product Data Meta Box - Main component
 * Features:
 * - Vertical tabs layout
 * - Top control bar (Product Type, Virtual, Downloadable)
 * - Tab-based content organization
 * - Responsive design
 */
export function ProductDataMetaBox({ data, onChange, productId }: ProductDataMetaBoxProps) {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [state, setState] = useState<ProductDataMetaBoxState>({
    productType: 'simple',
    isVirtual: false,
    isDownloadable: false,
    manageStock: false,
    stockStatus: 'instock',
    backorders: 'no',
    soldIndividually: false,
    upsellIds: [],
    crossSellIds: [],
    attributes: [],
    variations: [],
    menuOrder: 0,
    enableReviews: true,
    ...data,
  });

  // Update parent when state changes
  const updateState = (updates: Partial<ProductDataMetaBoxState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    onChange?.(newState);
  };

  // Determine which tabs should be visible
  const visibleTabs = [
    { id: 'general', label: 'Tổng quan', icon: '📊' },
    { id: 'inventory', label: 'Kiểm kê kho hàng', icon: '📦' },
    ...(state.isVirtual ? [] : [{ id: 'shipping', label: 'Giao hàng', icon: '🚚' }]),
    { id: 'linked', label: 'Sản phẩm liên kết', icon: '🔗' },
    { id: 'attributes', label: 'Thuộc tính', icon: '🏷️' },
    ...(state.productType === 'variable' && state.attributes.some((a) => a.usedForVariations)
      ? [{ id: 'variations', label: 'Biến thể', icon: '🔄' }]
      : []),
    { id: 'advanced', label: 'Nâng cao', icon: '⚙️' },
  ];

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralTab
            state={state}
            onUpdate={updateState}
          />
        );
      case 'inventory':
        return (
          <InventoryTab
            state={state}
            onUpdate={updateState}
            productId={productId}
          />
        );
      case 'shipping':
        return (
          <ShippingTab
            state={state}
            onUpdate={updateState}
          />
        );
      case 'linked':
        return (
          <LinkedProductsTab
            state={state}
            onUpdate={updateState}
            productId={productId}
          />
        );
      case 'attributes':
        return (
          <AttributesTab
            state={state}
            onUpdate={updateState}
          />
        );
      case 'variations':
        return (
          <VariationsTab
            state={state}
            onUpdate={updateState}
          />
        );
      case 'advanced':
        return (
          <AdvancedTab
            state={state}
            onUpdate={updateState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Top Control Bar */}
      <TopControlBar
        productType={state.productType}
        isVirtual={state.isVirtual}
        isDownloadable={state.isDownloadable}
        onProductTypeChange={(type) => updateState({ productType: type })}
        onVirtualChange={(isVirtual) => {
          updateState({ isVirtual });
          // If virtual, switch away from shipping tab
          if (isVirtual && activeTab === 'shipping') {
            setActiveTab('general');
          }
        }}
        onDownloadableChange={(isDownloadable) => updateState({ isDownloadable })}
      />

      <div className="flex flex-col md:flex-row min-h-[600px]">
        {/* Tab Navigation - Vertical on desktop, horizontal on mobile */}
        <div className="md:w-[200px] md:border-r border-input bg-muted/30">
          <TabNavigation
            tabs={visibleTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </Card>
  );
}
