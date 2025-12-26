'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import type { MappedProduct } from '@/lib/utils/productMapper';

/**
 * SEO Section Component
 * 
 * PHASE 2: Extract Form Sections - SeoSection
 * 
 * Displays SEO title, description, slug fields with character counters and preview
 * Uses Context API to access form state and handlers
 * 
 * @param product - Product data for preview (optional, only for non-bulk mode)
 * @param isBulkMode - Whether in bulk edit mode
 * @param onClose - Callback to close dialog (for "Edit full SEO" button)
 */
interface SeoSectionProps {
  product?: MappedProduct;
  isBulkMode: boolean;
  onClose: () => void;
}

export const SeoSection = memo(function SeoSection({
  product,
  isBulkMode,
  onClose,
}: SeoSectionProps) {
  const router = useRouter();
  const {
    register,
    watch,
    errors,
    getFieldClassName,
    savedFields,
  } = useQuickEditFormContext();

  const seoTitle = watch('seoTitle');
  const seoDescription = watch('seoDescription');
  const slug = watch('slug');

  return (
    <>
      {/* PHASE 2: SEO Fields Section (4.2.1) */}
      {/* PHASE 3: SEO Fields Conflict (7.3.1) - Limited fields with link to full form */}
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      {/* UX/UI UPGRADE Phase 4.2.1: Make section headers focusable for keyboard navigation */}
      <div 
        id="section-seo" 
        className="flex items-center justify-between mb-2 mt-6 scroll-mt-4"
        tabIndex={-1}
        role="region"
        aria-label="SEO & URL"
      >
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-600" aria-hidden="true" />
          <h3 className="text-base font-semibold text-slate-900">SEO & URL</h3>
          {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
          <div className="group relative">
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-help"
              aria-label="Thông tin về các trường SEO"
            >
              <Info className="h-4 w-4 text-slate-400" />
            </button>
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="font-semibold mb-1">Các trường có thể chỉnh sửa:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Meta Title (tối đa 60 ký tự)</li>
                <li>Meta Description (tối đa 160 ký tự)</li>
                <li>URL Slug</li>
              </ul>
              <p className="mt-2 pt-2 border-t border-slate-700">
                Để chỉnh sửa các trường SEO nâng cao (Focus Keyword, Canonical URL, Open Graph, Schema Markup, v.v.), vui lòng sử dụng form chỉnh sửa đầy đủ.
              </p>
            </div>
          </div>
        </div>
        {!isBulkMode && product?.id && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              router.push(`/admin/products/${product.id}/edit`);
              onClose(); // Close quick edit dialog
            }}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Chỉnh sửa SEO đầy đủ
          </Button>
        )}
      </div>
      
      {/* UX/UI UPGRADE Phase 1.1.2: Section spacing và borders */}
      {/* PHASE 5.3.3: Optimize Grid Layout - SEO Title & Description 2 cột */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding and spacing on mobile */}
      <div className="bg-slate-50 border border-slate-200 border-t-slate-300 rounded-md p-3 md:p-4 space-y-4 mb-4 md:mb-6">
        {/* SEO Title & SEO Description - Grid 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meta Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quick-edit-seo-title" className="text-slate-900">Meta Title</Label>
              <span className={`text-xs ${(seoTitle?.length || 0) > 60 ? 'text-red-500' : 'text-slate-500'}`}>
                {(seoTitle?.length || 0)}/60
              </span>
            </div>
            {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
            <Input
              id="quick-edit-seo-title"
              {...register('seoTitle')}
              maxLength={60}
              className={getFieldClassName('seoTitle', seoTitle, !!errors.seoTitle, savedFields.has('seoTitle'), 'quick-edit-seo-title')}
              placeholder="Nhập meta title (tối đa 60 ký tự)..."
              aria-label="Meta Title (SEO)"
              aria-describedby={errors.seoTitle ? 'quick-edit-seo-title-error' : 'quick-edit-seo-title-help'}
            />
            {errors.seoTitle && (
              <p id="quick-edit-seo-title-error" className="text-xs text-red-500" role="alert">{errors.seoTitle.message}</p>
            )}
            <p id="quick-edit-seo-title-help" className="text-xs text-slate-500">
              Tiêu đề hiển thị trên kết quả tìm kiếm. Nếu để trống, sẽ dùng tên sản phẩm.
            </p>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
            <div className="flex items-center justify-between min-h-[21px]">
              <Label htmlFor="quick-edit-seo-description" className="text-slate-900">Meta Description</Label>
              <span className={`text-xs flex-shrink-0 ${(seoDescription?.length || 0) > 160 ? 'text-red-500' : 'text-slate-500'}`}>
                {(seoDescription?.length || 0)}/160
              </span>
            </div>
            {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
            <textarea
              id="quick-edit-seo-description"
              {...register('seoDescription')}
              maxLength={160}
              rows={3}
              className={`flex w-full rounded-md border-2 bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none ${getFieldClassName('seoDescription', seoDescription, !!errors.seoDescription, savedFields.has('seoDescription'), 'quick-edit-seo-description')}`}
              placeholder="Nhập meta description (tối đa 160 ký tự)..."
              aria-label="Meta Description (SEO)"
              aria-describedby={errors.seoDescription ? 'quick-edit-seo-description-error' : 'quick-edit-seo-description-help'}
            />
            {errors.seoDescription && (
              <p id="quick-edit-seo-description-error" className="text-xs text-red-500" role="alert">{errors.seoDescription.message}</p>
            )}
            <p id="quick-edit-seo-description-help" className="text-xs text-slate-500">
              Mô tả ngắn hiển thị dưới tiêu đề trên kết quả tìm kiếm. Nếu để trống, sẽ dùng mô tả ngắn sản phẩm.
            </p>
          </div>
        </div>

        {/* URL Slug */}
        <div className="space-y-2">
          {/* FIX: Ensure Label alignment consistency - use min-h for label container */}
          <div className="min-h-[21px]">
            <Label htmlFor="quick-edit-slug" className="text-slate-900">URL Slug</Label>
          </div>
          {/* UX/UI UPGRADE Phase 4.1.1: ARIA labels cho tất cả fields */}
          <Input
            id="quick-edit-slug"
            {...register('slug')}
            className={getFieldClassName('slug', slug, !!errors.slug, savedFields.has('slug'), 'quick-edit-slug')}
            placeholder="gau-bong-tho-tai-dai"
            aria-label="URL Slug (đường dẫn thân thiện)"
            aria-describedby={errors.slug ? 'quick-edit-slug-error' : 'quick-edit-slug-help'}
          />
          {errors.slug && (
            <p id="quick-edit-slug-error" className="text-xs text-red-500" role="alert">{errors.slug.message}</p>
          )}
          <p id="quick-edit-slug-help" className="text-xs text-slate-500">
            URL thân thiện cho sản phẩm. Chỉ được chứa chữ thường, số và dấu gạch ngang.
          </p>
        </div>

        {/* SEO Preview */}
        {!isBulkMode && (() => {
          const previewSeoTitle = seoTitle || product?.name || 'Tên sản phẩm';
          const previewSeoDesc = seoDescription || product?.shortDescription || 'Mô tả sản phẩm';
          const previewSlug = slug || product?.slug || 'product-slug';
          const previewUrl = `https://shop-gaubong.com/products/${previewSlug}`;
          
          return (
            <div className="mt-4 p-3 bg-white border border-slate-300 rounded-md">
              <p className="text-xs font-medium text-slate-600 mb-2">Xem trước kết quả tìm kiếm:</p>
              <div className="space-y-1">
                <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                  {previewUrl}
                </p>
                <p className="text-lg text-blue-700 font-medium leading-tight">
                  {previewSeoTitle.length > 60 ? previewSeoTitle.substring(0, 60) + '...' : previewSeoTitle}
                </p>
                <p className="text-sm text-slate-600 leading-tight">
                  {previewSeoDesc.length > 160 ? previewSeoDesc.substring(0, 160) + '...' : previewSeoDesc}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
});

SeoSection.displayName = 'SeoSection';

