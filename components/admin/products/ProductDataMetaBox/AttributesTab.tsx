'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';
import { AttributeItem, type Attribute } from './AttributeItem';

interface AttributesTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
}

interface GlobalAttribute {
  id: string;
  name: string;
  values: string[];
}

/**
 * Attributes Tab - Product Attributes
 * Features:
 * - Add Attribute section (Global vs Custom)
 * - Attribute Item component với Tags/Chips UI
 * - Color Picker integration
 * - Used for variations checkbox logic
 */
export function AttributesTab({ state, onUpdate }: AttributesTabProps) {
  const [globalAttributes, setGlobalAttributes] = useState<GlobalAttribute[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [selectedGlobalAttribute, setSelectedGlobalAttribute] = useState<string>('');
  const [customAttributeName, setCustomAttributeName] = useState('');

  // Fetch global attributes
  useEffect(() => {
    const fetchGlobalAttributes = async () => {
      setLoadingAttributes(true);
      try {
        // TODO: Replace with actual API endpoint when available
        // const response = await fetch('/api/admin/products/attributes');
        // const data = await response.json();
        // setGlobalAttributes(data.attributes || []);
        
        // For now, use empty array or mock data
        setGlobalAttributes([]);
      } catch (error) {
        console.error('Error fetching global attributes:', error);
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchGlobalAttributes();
  }, []);

  // Get all existing values from all attributes for auto-suggest
  const getAllExistingValues = (): string[] => {
    const allValues: string[] = [];
    state.attributes.forEach((attr) => {
      allValues.push(...attr.values);
    });
    return [...new Set(allValues)]; // Remove duplicates
  };

  const handleAddGlobalAttribute = () => {
    if (!selectedGlobalAttribute) return;

    const globalAttr = globalAttributes.find((a) => a.id === selectedGlobalAttribute);
    if (!globalAttr) return;

    // Check if attribute already exists
    if (state.attributes.some((a) => a.name === globalAttr.name)) {
      alert('Thuộc tính này đã được thêm');
      return;
    }

    const newAttribute: Attribute = {
      id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: globalAttr.name,
      isGlobal: true,
      values: [...globalAttr.values],
      usedForVariations: false,
    };

    onUpdate({
      attributes: [...state.attributes, newAttribute],
    });

    setSelectedGlobalAttribute('');
  };

  const handleAddCustomAttribute = () => {
    if (!customAttributeName.trim()) return;

    // Check if attribute already exists
    if (state.attributes.some((a) => a.name.toLowerCase() === customAttributeName.trim().toLowerCase())) {
      alert('Thuộc tính này đã được thêm');
      return;
    }

    const newAttribute: Attribute = {
      id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: customAttributeName.trim(),
      isGlobal: false,
      values: [],
      usedForVariations: false,
    };

    onUpdate({
      attributes: [...state.attributes, newAttribute],
    });

    setCustomAttributeName('');
  };

  const handleUpdateAttribute = (updated: Attribute) => {
    onUpdate({
      attributes: state.attributes.map((a) => (a.id === updated.id ? updated : a)),
    });
  };

  const handleRemoveAttribute = (id: string) => {
    onUpdate({
      attributes: state.attributes.filter((a) => a.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Thuộc tính sản phẩm</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Thêm các thuộc tính như màu sắc, kích thước để tạo biến thể sản phẩm
        </p>
      </div>

      {/* Add Attribute Section */}
      <div className="p-4 border border-input rounded-lg bg-muted/30 space-y-4">
        <Label className="text-sm font-semibold">Thêm thuộc tính</Label>

        {/* Global Attributes */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Thuộc tính Global</Label>
          <div className="flex items-center gap-2">
            <Select
              value={selectedGlobalAttribute}
              onChange={(e) => setSelectedGlobalAttribute(e.target.value)}
              className="flex-1"
              disabled={loadingAttributes || globalAttributes.length === 0}
            >
              <option value="">Chọn thuộc tính global...</option>
              {globalAttributes.map((attr) => (
                <option key={attr.id} value={attr.id}>
                  {attr.name} ({attr.values.length} giá trị)
                </option>
              ))}
            </Select>
            {loadingAttributes && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddGlobalAttribute}
              disabled={!selectedGlobalAttribute || loadingAttributes}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          </div>
          {globalAttributes.length === 0 && !loadingAttributes && (
            <p className="text-xs text-muted-foreground">
              Chưa có thuộc tính global nào. Sử dụng thuộc tính tùy chỉnh bên dưới.
            </p>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Custom Attribute */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Thuộc tính tùy chỉnh</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={customAttributeName}
              onChange={(e) => setCustomAttributeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomAttribute();
                }
              }}
              placeholder="VD: Kích thước, Màu sắc, Chất liệu..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomAttribute}
              disabled={!customAttributeName.trim()}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          </div>
        </div>
      </div>

      {/* Attributes List */}
      {state.attributes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-input rounded-lg">
          <p className="text-sm text-muted-foreground">Chưa có thuộc tính nào</p>
          <p className="text-xs text-muted-foreground mt-1">
            Thêm thuộc tính để bắt đầu
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {state.attributes.map((attribute) => (
            <AttributeItem
              key={attribute.id}
              attribute={attribute}
              onUpdate={handleUpdateAttribute}
              onRemove={() => handleRemoveAttribute(attribute.id)}
              existingValues={getAllExistingValues()}
            />
          ))}
        </div>
      )}

      {/* Info Box */}
      {state.attributes.some((a) => a.usedForVariations) && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-900 dark:text-green-200">
            <strong>✓ Sẵn sàng tạo biến thể:</strong> Bạn có thể chuyển sang tab "Biến thể" để tạo các biến thể từ các thuộc tính đã chọn.
          </p>
        </div>
      )}
    </div>
  );
}
