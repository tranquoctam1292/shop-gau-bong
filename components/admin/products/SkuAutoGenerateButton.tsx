/**
 * SKU Auto Generate Button
 * 
 * Button component for generating SKU automatically
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface SkuAutoGenerateButtonProps {
  productName: string;
  categoryId?: string;
  brandId?: string;
  onSkuGenerated: (sku: string) => void;
  excludeProductId?: string;
  disabled?: boolean;
}

export function SkuAutoGenerateButton({
  productName,
  categoryId,
  brandId,
  onSkuGenerated,
  excludeProductId,
  disabled,
}: SkuAutoGenerateButtonProps) {
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!productName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm trước', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/sku/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productName: productName.trim(),
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          isVariant: false,
          previewMode: false,
          excludeProductId: excludeProductId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate SKU');
      }

      if (data.data?.sku) {
        onSkuGenerated(data.data.sku);
        showToast('Đã sinh SKU tự động', 'success');
      } else {
        throw new Error('SKU không được trả về từ server');
      }
    } catch (error: any) {
      console.error('[SKU Auto Generate] Error:', error);
      showToast(error.message || 'Đã xảy ra lỗi khi sinh SKU', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading || disabled || !productName.trim()}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang sinh...
        </>
      ) : (
        <>
          <Zap className="h-4 w-4" />
          Auto Gen
        </>
      )}
    </Button>
  );
}

