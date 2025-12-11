'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Eye, Save, Send, Loader2, Lock, Globe } from 'lucide-react';

interface PublishBoxProps {
  status: 'draft' | 'publish';
  isActive: boolean;
  visibility?: 'public' | 'private';
  onStatusChange: (status: 'draft' | 'publish') => void;
  onIsActiveChange: (isActive: boolean) => void;
  onVisibilityChange?: (visibility: 'public' | 'private') => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onPreview?: () => void;
  loading?: boolean;
  productId?: string;
  productSlug?: string;
}

/**
 * Publish Box - Sidebar component cho publish/save actions
 * Giống WordPress publish box với đầy đủ tính năng:
 * - Publish button với confirmation
 * - Save Draft button
 * - Preview button
 * - Status selector (Draft, Published)
 * - Visibility settings (Public, Private)
 */
export function PublishBox({
  status,
  isActive,
  visibility = 'public',
  onStatusChange,
  onIsActiveChange,
  onVisibilityChange,
  onPublish,
  onSaveDraft,
  onPreview,
  loading = false,
  productId,
  productSlug,
}: PublishBoxProps) {
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);

  const handlePublishClick = () => {
    if (showConfirmPublish) {
      onPublish();
      setShowConfirmPublish(false);
    } else {
      setShowConfirmPublish(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirmPublish(false), 3000);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else if (productSlug) {
      // Open preview in new tab
      window.open(`/products/${productSlug}`, '_blank');
    } else {
      // If no slug yet, show message
      alert('Vui lòng nhập slug để xem trước sản phẩm');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" />
          Xuất bản
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Selector */}
        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as 'draft' | 'publish')}
            disabled={loading}
          >
            <option value="draft">Bản nháp</option>
            <option value="publish">Đã xuất bản</option>
          </Select>
        </div>

        {/* Visibility Settings */}
        {onVisibilityChange && (
          <div className="space-y-2">
            <Label htmlFor="visibility">Hiển thị</Label>
            <Select
              id="visibility"
              value={visibility}
              onChange={(e) => onVisibilityChange(e.target.value as 'public' | 'private')}
              disabled={loading}
            >
              <option value="public">Công khai</option>
              <option value="private">Riêng tư</option>
            </Select>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {visibility === 'public' ? (
                <>
                  <Globe className="h-3 w-3" />
                  Sản phẩm sẽ hiển thị công khai
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Sản phẩm chỉ hiển thị cho admin
                </>
              )}
            </p>
          </div>
        )}

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => onIsActiveChange(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
            Sản phẩm đang hoạt động
          </Label>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t">
          {/* Publish Button */}
          <Button
            type="button"
            onClick={handlePublishClick}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : showConfirmPublish ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Xác nhận xuất bản
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {productId ? 'Cập nhật' : 'Xuất bản'}
              </>
            )}
          </Button>

          {/* Save Draft Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu nháp
              </>
            )}
          </Button>

          {/* Preview Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={loading || !productSlug}
            className="w-full"
            size="lg"
          >
            <Eye className="h-4 w-4 mr-2" />
            Xem trước
          </Button>
        </div>

        {/* Info Message */}
        {!productSlug && (
          <p className="text-xs text-muted-foreground">
            Nhập slug để sử dụng tính năng xem trước
          </p>
        )}
      </CardContent>
    </Card>
  );
}

