'use client';

import { Button } from '@/components/ui/button';
import { Save, Eye, Loader2 } from 'lucide-react';

interface StickyActionBarProps {
  onSave: () => void | Promise<void>;
  onPreview?: () => void;
  loading?: boolean;
  productId?: string;
  productSlug?: string;
  disabled?: boolean;
}

/**
 * Sticky Action Bar - Fixed bottom bar với Save và Preview buttons
 * Features:
 * - Fixed position ở bottom của viewport
 * - Save button (primary)
 * - Preview button (optional)
 * - Loading states
 * - Shadow/elevation để tách biệt với content
 */
export function StickyActionBar({
  onSave,
  onPreview,
  loading = false,
  productId,
  productSlug,
  disabled = false,
}: StickyActionBarProps) {
  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else if (productId && productSlug) {
      // Open preview in new tab
      const previewUrl = `/products/${productSlug}`;
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Info or empty */}
          <div className="flex-1">
            {/* Optional: Add unsaved changes indicator here */}
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Preview Button */}
            {onPreview || (productId && productSlug) ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={loading || disabled || !productId || !productSlug}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Xem trước
              </Button>
            ) : null}

            {/* Save Button */}
            <Button
              type="button"
              onClick={onSave}
              disabled={loading || disabled}
              className="gap-2 min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
