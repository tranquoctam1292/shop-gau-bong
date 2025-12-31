'use client';

import { useState, memo } from 'react';
import { SEOScoreBadge } from './SEOScoreBadge';
import { SEOIssuesSummary } from './SEOIssuesList';
import { ChevronDown, ChevronUp, ExternalLink, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ProductSEOFields } from '@/types/seo';

export interface ProductSEOData {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  seo?: ProductSEOFields;
}

interface ProductSEORowProps {
  product: ProductSEOData;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

function ProductSEORowComponent({
  product,
  isSelected = false,
  onSelect,
  onEdit,
  className,
}: ProductSEORowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const seo = product.seo || {};
  const score = seo.seoScore ?? 0;
  const issues = seo.seoIssues || [];

  const displayTitle = seo.seoTitle || product.name;
  const displayDescription = seo.seoDescription || '';
  const displaySlug = seo.slug || product.slug;

  return (
    <div
      className={cn(
        'border-b last:border-b-0 transition-colors',
        isSelected && 'bg-blue-50',
        className
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-4 p-4">
        {/* Checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(product._id, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}

        {/* Product Image */}
        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No img
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span className="truncate max-w-[200px]">/{displaySlug}</span>
            <Link
              href={`/san-pham/${displaySlug}`}
              target="_blank"
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* SEO Score */}
        <div className="flex-shrink-0">
          <SEOScoreBadge score={score} size="md" />
        </div>

        {/* Issues Summary */}
        <div className="flex-shrink-0 w-32">
          <SEOIssuesSummary issues={issues} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(product._id)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa SEO"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-20 space-y-3 border-t bg-gray-50">
          <div className="pt-3">
            {/* SEO Title Preview */}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Tiêu đề SEO ({displayTitle.length}/60)
              </label>
              <p
                className={cn(
                  'mt-1 text-blue-800 font-medium',
                  displayTitle.length > 60 && 'text-red-600'
                )}
              >
                {displayTitle || <span className="text-gray-400 italic">Chưa có tiêu đề</span>}
              </p>
            </div>

            {/* SEO Description Preview */}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Mô tả SEO ({displayDescription.length}/160)
              </label>
              <p
                className={cn(
                  'mt-1 text-gray-600 text-sm',
                  displayDescription.length > 160 && 'text-red-600'
                )}
              >
                {displayDescription || (
                  <span className="text-gray-400 italic">Chưa có mô tả</span>
                )}
              </p>
            </div>

            {/* Focus Keyword */}
            {seo.focusKeyword && (
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Từ khóa trọng tâm
                </label>
                <p className="mt-1 text-sm">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded">
                    {seo.focusKeyword}
                  </span>
                </p>
              </div>
            )}

            {/* Google Preview */}
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Xem trước trên Google
              </label>
              <div className="max-w-lg">
                <p className="text-blue-800 text-lg hover:underline cursor-pointer truncate">
                  {displayTitle || product.name}
                </p>
                <p className="text-green-700 text-sm">
                  {process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com'}/san-pham/{displaySlug}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {displayDescription || 'Mua ' + product.name + ' giá tốt tại Shop Gấu Bông. Giao hàng nhanh, đổi trả miễn phí.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const ProductSEORow = memo(ProductSEORowComponent);
export default ProductSEORow;
