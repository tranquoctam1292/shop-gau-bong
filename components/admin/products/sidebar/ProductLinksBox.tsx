'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Link as LinkIcon, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductLinksBoxProps {
  slug: string;
  productId?: string;
  status?: 'draft' | 'publish';
  onSlugChange: (slug: string) => void;
}

/**
 * Product Links Box - Sidebar component cho product links management
 * Features:
 * - Permalink editor (slug)
 * - View product link (if published)
 * - Duplicate product link
 */
export function ProductLinksBox({
  slug,
  productId,
  status,
  onSlugChange,
}: ProductLinksBoxProps) {
  const router = useRouter();
  const [slugInput, setSlugInput] = useState(slug);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleSlugSubmit = () => {
    if (slugInput.trim()) {
      onSlugChange(slugInput.trim());
    } else {
      setSlugInput(slug);
    }
  };

  const handleDuplicate = async () => {
    if (!productId) {
      alert('Không thể duplicate sản phẩm mới. Vui lòng lưu sản phẩm trước.');
      return;
    }

    if (
      !confirm(
        'Bạn có chắc chắn muốn tạo bản sao của sản phẩm này? Sản phẩm mới sẽ được tạo với trạng thái "Bản nháp".'
      )
    ) {
      return;
    }

    setIsDuplicating(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate product');
      }

      const result = await response.json();
      const newProductId = result.product?._id || result.product?.id;

      if (newProductId) {
        // Redirect to edit page of duplicated product
        router.push(`/admin/products/${newProductId}/edit`);
        router.refresh();
      } else {
        alert('Sản phẩm đã được duplicate thành công!');
      }
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      alert(error.message || 'Có lỗi xảy ra khi duplicate sản phẩm');
    } finally {
      setIsDuplicating(false);
    }
  };

  const viewProductUrl = status === 'publish' && slug ? `/products/${slug}` : null;
  const editProductUrl = productId ? `/admin/products/${productId}/edit` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Liên kết
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permalink Editor */}
        <div className="space-y-2">
          <Label htmlFor="sidebar-slug">Permalink (Slug)</Label>
          <div className="flex gap-2">
            <Input
              id="sidebar-slug"
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSlugSubmit()}
              onBlur={handleSlugSubmit}
              placeholder="product-slug"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            URL: /products/{slugInput || slug}
          </p>
        </div>

        {/* View Product Link */}
        {viewProductUrl && (
          <div className="space-y-2">
            <Label className="text-sm">Xem sản phẩm</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(viewProductUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Mở trong tab mới
            </Button>
          </div>
        )}

        {/* Edit Product Link */}
        {editProductUrl && (
          <div className="space-y-2">
            <Label className="text-sm">Chỉnh sửa</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push(editProductUrl)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Đi tới trang chỉnh sửa
            </Button>
          </div>
        )}

        {/* Duplicate Product */}
        {productId && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm">Thao tác</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo bản sao...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Tạo bản sao
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Tạo bản sao sản phẩm này với trạng thái "Bản nháp"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
