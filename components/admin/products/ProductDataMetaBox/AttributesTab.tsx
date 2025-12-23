'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import type { ProductDataMetaBoxState } from './ProductDataMetaBox';
import { AttributeItem, type Attribute } from './AttributeItem';
import { AttributeLibraryModal } from '../AttributeLibraryModal';
import type { Attribute as GlobalAttribute } from '@/app/admin/attributes/page';
import type { Term } from '@/app/admin/attributes/[id]/terms/page';
import { SmartValueInput } from '../SmartValueInput';
import { QuickAddTermModal } from '../QuickAddTermModal';

interface AttributesTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
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
  const [customAttributeName, setCustomAttributeName] = useState('');
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddAttribute, setQuickAddAttribute] = useState<GlobalAttribute | null>(null);
  const [globalTermsMap, setGlobalTermsMap] = useState<Record<string, Term[]>>({});
  const [loadingTerms, setLoadingTerms] = useState<Record<string, boolean>>({});
  const [pendingFetches, setPendingFetches] = useState<Set<string>>(new Set());
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  // Fetch global attributes
  useEffect(() => {
    const fetchGlobalAttributes = async () => {
      setLoadingAttributes(true);
      try {
        const response = await fetch('/api/admin/attributes');
        if (response.ok) {
          const data = await response.json();
          setGlobalAttributes(data.attributes || []);
        }
      } catch (error) {
        console.error('Error fetching global attributes:', error);
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchGlobalAttributes();
  }, []);

  // Fetch terms for a global attribute (with race condition protection)
  const fetchTermsForAttribute = async (attributeId: string) => {
    // Check if already loaded or currently loading
    if (globalTermsMap[attributeId] || pendingFetches.has(attributeId)) {
      return; // Already loaded or loading
    }

    // Mark as pending
    setPendingFetches((prev) => new Set(prev).add(attributeId));
    setLoadingTerms((prev) => ({ ...prev, [attributeId]: true }));
    
    try {
      const response = await fetch(`/api/admin/attributes/${attributeId}/terms`);
      if (response.ok) {
        const data = await response.json();
        setGlobalTermsMap((prev) => ({
          ...prev,
          [attributeId]: data.terms || [],
        }));
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    } finally {
      setLoadingTerms((prev) => ({ ...prev, [attributeId]: false }));
      // Remove from pending set
      setPendingFetches((prev) => {
        const next = new Set(prev);
        next.delete(attributeId);
        return next;
      });
    }
  };

  // Pre-fetch terms for all attributes when modal opens (for preview)
  useEffect(() => {
    if (isLibraryModalOpen && globalAttributes.length > 0) {
      globalAttributes.forEach((attr) => {
        if (!globalTermsMap[attr.id] && !pendingFetches.has(attr.id)) {
          fetchTermsForAttribute(attr.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLibraryModalOpen]);

  // Get all existing values from all attributes for auto-suggest
  const getAllExistingValues = (): string[] => {
    const allValues: string[] = [];
    state.attributes.forEach((attr) => {
      allValues.push(...attr.values);
    });
    return [...new Set(allValues)]; // Remove duplicates
  };

  const handleSelectGlobalAttribute = (globalAttr: GlobalAttribute) => {
    // Check if attribute already exists
    if (state.attributes.some((a) => a.name === globalAttr.name)) {
      alert('Thuộc tính này đã được thêm');
      return;
    }

    // Fetch terms for this attribute
    fetchTermsForAttribute(globalAttr.id);

    // Create new attribute with empty values (will be populated from terms)
    const newAttribute: Attribute = {
      id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: globalAttr.name,
      isGlobal: true,
      globalAttributeId: globalAttr.id, // Store reference to global attribute
      values: [], // Will be populated from terms
      usedForVariations: false,
    };

    onUpdate({
      attributes: [...state.attributes, newAttribute],
    });
  };

  // Handle bulk selection from modal
  const handleBulkSelectAttributes = (selectedAttributeIds: string[]) => {
    const newAttributes: Attribute[] = [];
    
    selectedAttributeIds.forEach((attributeId) => {
      const globalAttr = globalAttributes.find((a) => a.id === attributeId);
      if (!globalAttr) return;

      // Check if attribute already exists
      if (state.attributes.some((a) => a.globalAttributeId === attributeId)) {
        return; // Skip if already added
      }

      // Fetch terms for this attribute
      fetchTermsForAttribute(attributeId);

      // Create new attribute
      const newAttribute: Attribute = {
        id: `attr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: globalAttr.name,
        isGlobal: true,
        globalAttributeId: globalAttr.id,
        values: [],
        usedForVariations: false,
      };

      newAttributes.push(newAttribute);
    });

    if (newAttributes.length > 0) {
      onUpdate({
        attributes: [...state.attributes, ...newAttributes],
      });
    }
  };

  const handleQuickAddTerm = (attribute: GlobalAttribute) => {
    setQuickAddAttribute(attribute);
    setQuickAddModalOpen(true);
  };

  const handleQuickAddSuccess = (termName: string) => {
    if (!quickAddAttribute) return;

    // Refresh terms for this attribute
    setGlobalTermsMap((prev) => {
      const currentTerms = prev[quickAddAttribute.id] || [];
      // The new term will be fetched on next render, but we can optimistically add it
      return prev;
    });

    // Reload terms
    fetchTermsForAttribute(quickAddAttribute.id);

    // Auto-select the new term in the corresponding attribute
    const attribute = state.attributes.find(
      (a) => a.globalAttributeId === quickAddAttribute.id
    );
    if (attribute) {
      handleUpdateAttribute({
        ...attribute,
        values: [...attribute.values, termName],
      });
    }

    setQuickAddModalOpen(false);
    setQuickAddAttribute(null);
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

        {/* Global Attributes - Modal Button */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Thuộc tính Global</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsLibraryModalOpen(true)}
            className="w-full justify-start h-auto py-3 px-4 text-left"
          >
            <Plus className="h-5 w-5 mr-2" />
            <div className="flex-1">
              <div className="font-medium">Thêm thuộc tính từ thư viện</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Chọn nhiều thuộc tính cùng lúc từ danh sách
              </div>
            </div>
          </Button>
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
          {state.attributes.map((attribute) => {
            // Find global attribute info if it's a global attribute
            const globalAttr = attribute.globalAttributeId
              ? globalAttributes.find((a) => a.id === attribute.globalAttributeId)
              : null;
            const terms = attribute.globalAttributeId
              ? globalTermsMap[attribute.globalAttributeId] || []
              : [];
            const isLoadingTerms = attribute.globalAttributeId
              ? loadingTerms[attribute.globalAttributeId] || false
              : false;

            return (
              <AttributeItem
                key={attribute.id}
                attribute={attribute}
                onUpdate={handleUpdateAttribute}
                onRemove={() => handleRemoveAttribute(attribute.id)}
                existingValues={getAllExistingValues()}
                // New props for global attributes
                isGlobalAttribute={!!attribute.globalAttributeId}
                globalAttributeType={globalAttr?.type}
                globalTerms={terms}
                loadingTerms={isLoadingTerms}
                onLoadTerms={() => {
                  if (attribute.globalAttributeId) {
                    fetchTermsForAttribute(attribute.globalAttributeId);
                  }
                }}
                onQuickAddTerm={() => {
                  if (globalAttr) {
                    handleQuickAddTerm(globalAttr);
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Attribute Library Modal */}
      <AttributeLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onApply={handleBulkSelectAttributes}
        attributes={globalAttributes}
        loading={loadingAttributes}
        selectedAttributeIds={state.attributes
          .filter((a) => a.isGlobal && a.globalAttributeId)
          .map((a) => a.globalAttributeId!)
          .filter(Boolean)}
        termsMap={globalTermsMap}
      />

      {/* Quick Add Term Modal */}
      {quickAddAttribute && (
        <QuickAddTermModal
          isOpen={quickAddModalOpen}
          onClose={() => {
            setQuickAddModalOpen(false);
            setQuickAddAttribute(null);
          }}
          attribute={quickAddAttribute}
          onSuccess={handleQuickAddSuccess}
        />
      )}

      {/* Info Box */}
      {state.attributes.some((a) => a.usedForVariations) && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-900 dark:text-green-200">
            <strong>✓ Sẵn sàng tạo biến thể:</strong> Bạn có thể chuyển sang tab &quot;Biến thể&quot; để tạo các biến thể từ các thuộc tính đã chọn.
          </p>
        </div>
      )}
    </div>
  );
}
