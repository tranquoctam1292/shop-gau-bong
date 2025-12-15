/**
 * Variant SKU Generator
 * 
 * Component for generating SKUs for variants with live preview
 */

'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Zap, Info } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';
// Tooltip component not found, using title attribute instead
import type { Variation } from './ProductDataMetaBox/VariationTable';

interface VariantSkuGeneratorProps {
  variations: Variation[];
  productName: string;
  categoryId?: string;
  onVariationsChange: (variations: Variation[]) => void;
  autoGenerateEnabled: boolean;
  onAutoGenerateChange: (enabled: boolean) => void;
  onPreviewSkusChange?: (previews: Record<string, string>) => void;
  onHasIncrementTokenChange?: (hasToken: boolean) => void;
}

/**
 * Generate SKU preview for a variant
 */
async function generateSkuPreview(
  productName: string,
  categoryId: string | undefined,
  attributes: Record<string, string>,
  previewMode: boolean = true
): Promise<string> {
  try {
    // Convert attributes to array format
    const attributePairs = Object.entries(attributes).map(([key, value]) => ({
      key,
      value,
    }));

    const response = await fetch('/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        productName,
        categoryId: categoryId || undefined,
        attributes: attributePairs,
        isVariant: true,
        previewMode,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to generate SKU');
    }

    return data.data?.sku || '';
  } catch (error) {
    console.error('[Variant SKU Preview] Error:', error);
    return '';
  }
}

/**
 * Generate actual SKU for a variant (not preview)
 */
async function generateSku(
  productName: string,
  categoryId: string | undefined,
  attributes: Record<string, string>,
  excludeProductId?: string
): Promise<string> {
  try {
    const attributePairs = Object.entries(attributes).map(([key, value]) => ({
      key,
      value,
    }));

    const response = await fetch('/api/admin/sku/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        productName,
        categoryId: categoryId || undefined,
        attributes: attributePairs,
        isVariant: true,
        previewMode: false,
        excludeProductId,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to generate SKU');
    }

    return data.data?.sku || '';
  } catch (error) {
    console.error('[Variant SKU Generate] Error:', error);
    throw error;
  }
}

export function VariantSkuGenerator({
  variations,
  productName,
  categoryId,
  onVariationsChange,
  autoGenerateEnabled,
  onAutoGenerateChange,
  onPreviewSkusChange,
  onHasIncrementTokenChange,
}: VariantSkuGeneratorProps) {
  const { showToast } = useToastContext();
  const [previewSkus, setPreviewSkus] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasIncrementToken, setHasIncrementToken] = useState(false);

  // Check if pattern has {INCREMENT} token
  useEffect(() => {
    async function checkPattern() {
      try {
        const response = await fetch(`/api/admin/sku/settings${categoryId ? `?categoryId=${categoryId}` : ''}`);
        const data = await response.json();
        if (data.success && data.data) {
          const pattern = (data.data.global || data.data)?.pattern || '';
          const hasToken = pattern.includes('{INCREMENT}');
          setHasIncrementToken(hasToken);
          onHasIncrementTokenChange?.(hasToken);
        }
      } catch (error) {
        console.error('[Check Pattern] Error:', error);
      }
    }
    checkPattern();
  }, [categoryId, onHasIncrementTokenChange]);

  // Generate preview SKUs when auto-generate is enabled
  useEffect(() => {
    if (!autoGenerateEnabled || !productName.trim()) {
      setPreviewSkus({});
      return;
    }

    const generatePreviews = async () => {
      const newPreviews: Record<string, string> = {};
      
      for (const variation of variations) {
        if (Object.keys(variation.attributes).length === 0) continue;
        
        try {
          const preview = await generateSkuPreview(
            productName,
            categoryId,
            variation.attributes,
            true // preview mode
          );
          if (preview) {
            newPreviews[variation.id] = preview;
          }
        } catch (error) {
          // Silently fail for preview
        }
      }
      
      setPreviewSkus(newPreviews);
      onPreviewSkusChange?.(newPreviews);
    };

    generatePreviews();
  }, [autoGenerateEnabled, productName, categoryId, variations, onPreviewSkusChange]);

  // Handle regenerate all SKUs
  const handleRegenerateAll = async () => {
    if (!productName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm trước', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const updatedVariations = await Promise.all(
        variations.map(async (variation) => {
          if (Object.keys(variation.attributes).length === 0) {
            return variation;
          }

          try {
            const sku = await generateSku(
              productName,
              categoryId,
              variation.attributes
            );
            return { ...variation, sku };
          } catch (error: any) {
            console.error(`[Regenerate SKU] Error for variation ${variation.id}:`, error);
            return variation; // Keep existing SKU on error
          }
        })
      );

      onVariationsChange(updatedVariations);
      showToast('Đã tạo lại SKU cho tất cả biến thể', 'success');
    } catch (error: any) {
      showToast(error.message || 'Đã xảy ra lỗi khi tạo lại SKU', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Expose previewSkus and hasIncrementToken for parent component
  useEffect(() => {
    onPreviewSkusChange?.(previewSkus);
  }, [previewSkus, onPreviewSkusChange]);

  return (
    <div className="space-y-3 mb-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            id="auto-generate-sku"
            checked={autoGenerateEnabled}
            onCheckedChange={(checked) => onAutoGenerateChange(checked === true)}
          />
          <Label
            htmlFor="auto-generate-sku"
            className="text-sm font-medium cursor-pointer"
          >
            Tự động sinh SKU cho tất cả biến thể
          </Label>
          {hasIncrementToken && (
            <span
              title="Pattern có chứa {INCREMENT}. Số thứ tự thực tế sẽ được gán khi lưu sản phẩm để đảm bảo không trùng lặp."
              className="cursor-help"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
            </span>
          )}
        </div>
        {variations.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerateAll}
            disabled={isGenerating || !productName.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Tạo lại SKU
              </>
            )}
          </Button>
        )}
      </div>
      {autoGenerateEnabled && (
        <p className="text-xs text-muted-foreground ml-7">
          SKU sẽ được tự động sinh dựa trên pattern đã cấu hình. Bạn có thể chỉnh sửa thủ công nếu cần.
        </p>
      )}
    </div>
  );
}

// Note: useVariantSkuPreview hook removed - preview logic is handled directly in VariationTable

