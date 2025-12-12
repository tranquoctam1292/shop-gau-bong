'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { TopControlBar } from './TopControlBar';
import { TabNavigation } from './TabNavigation';
import { GeneralTab } from './GeneralTab';
import { InventoryTab } from './InventoryTab';
import { ShippingTab } from './ShippingTab';
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
    attributes: [],
    variations: [],
    menuOrder: 0,
    enableReviews: true,
    ...data,
  });

  // Sync state with data prop changes
  // Use useRef to track if we're updating from internal state to prevent cycles
  const isInternalUpdateRef = useRef(false);
  const prevDataRef = useRef(data);
  const dataStringRef = useRef<string>('');
  
  useEffect(() => {
    // Serialize data for comparison (avoid reference comparison issues)
    const currentDataString = JSON.stringify(data);
    
    // Only sync if data prop actually changed and not from internal update
    if (data && currentDataString !== dataStringRef.current && !isInternalUpdateRef.current) {
      dataStringRef.current = currentDataString;
      prevDataRef.current = data;
      
      setState((prevState) => {
        // Only update if data actually changed (prevent infinite loops)
        const hasChanges = Object.keys(data).some(
          (key) => prevState[key as keyof ProductDataMetaBoxState] !== data[key as keyof ProductDataMetaBoxState]
        );
        if (!hasChanges) {
          return prevState;
        }
        
        return {
          ...prevState,
          ...data,
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Update parent when state changes
  const updateState = (updates: Partial<ProductDataMetaBoxState>) => {
    // Check if updates actually change anything (use JSON.stringify for arrays/objects)
    const hasActualChanges = Object.keys(updates).some((key) => {
      const currentValue = state[key as keyof ProductDataMetaBoxState];
      const newValue = updates[key as keyof ProductDataMetaBoxState];
      
      // For arrays/objects, use JSON.stringify comparison
      if (Array.isArray(currentValue) || Array.isArray(newValue) || 
          (typeof currentValue === 'object' && currentValue !== null) ||
          (typeof newValue === 'object' && newValue !== null)) {
        return JSON.stringify(currentValue) !== JSON.stringify(newValue);
      }
      
      // For primitives, use !==
      return currentValue !== newValue;
    });
    
    if (!hasActualChanges) {
      return; // Skip if no actual changes
    }
    
    // Mark as internal update to prevent sync cycle
    isInternalUpdateRef.current = true;
    
    // Calculate new state
    const newState = { ...state, ...updates };
    
    setState(newState);
    
    // Call onChange with calculated newState (outside setState to avoid duplicate calls in React batches)
    onChange?.(newState);
    
    // Reset flag after a short delay to allow sync to complete
    // Use requestAnimationFrame to defer to next render cycle
    requestAnimationFrame(() => {
      isInternalUpdateRef.current = false;
    });
  };

  // Determine which tabs should be visible
  const visibleTabs = [
    { id: 'general', label: 'Tổng quan', icon: '📊' },
    { id: 'inventory', label: 'Kiểm kê kho hàng', icon: '📦' },
    ...(state.isVirtual ? [] : [{ id: 'shipping', label: 'Giao hàng', icon: '🚚' }]),
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
