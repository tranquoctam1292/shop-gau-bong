'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, XCircle, Star, Package, Image as ImageIcon, Link, FileText, Code, Copy } from 'lucide-react';
import { MediaLibraryModal, type MediaItem } from './MediaLibraryModal';
import { generateProductSchema } from '@/lib/utils/schema';

export interface SEOMetaBoxData {
  focusKeyword?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  ogImage?: string;
  ogImageId?: string;
  socialDescription?: string;
}

interface SEOMetaBoxProps {
  data: SEOMetaBoxData;
  onChange: (data: SEOMetaBoxData) => void;
  // Product data for auto-fill and templates
  productName?: string;
  productPrice?: number;
  productSalePrice?: number;
  productSku?: string;
  productCategory?: string;
  productBrand?: string;
  productShortDescription?: string;
  productDescription?: string;
  productImage?: string;
  productStockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  productStockQuantity?: number;
  productRating?: number;
  productSlug?: string;
  siteName?: string;
  // For internal links check
  hasRelatedProducts?: boolean; // Check if product has upsell/cross-sell
}

/**
 * Calculate pixel width of text (approximate)
 */
function getTextWidth(text: string): number {
  // Approximate: average character width ~6.5px for most fonts
  return text.length * 6.5;
}

/**
 * Get progress bar color based on length
 */
function getProgressColor(type: 'title' | 'description', length: number): string {
  if (type === 'title') {
    const width = getTextWidth(length.toString());
    if (width < 200) return 'bg-gray-400'; // Too short
    if (width < 400) return 'bg-orange-400'; // Good
    if (width < 580) return 'bg-green-500'; // Perfect
    return 'bg-red-500'; // Too long
  } else {
    // Description: 155-160 chars is perfect
    if (length < 100) return 'bg-gray-400'; // Too short
    if (length < 130) return 'bg-orange-400'; // Good
    if (length <= 160) return 'bg-green-500'; // Perfect
    return 'bg-red-500'; // Too long
  }
}

/**
 * Replace template variables in SEO title
 */
function replaceTemplateVariables(template: string, props: SEOMetaBoxProps): string {
  const price = props.productSalePrice || props.productPrice || 0;
  const priceFormatted = price > 0 ? `${(price / 1000).toFixed(0)}k` : '';
  
  return template
    .replace(/%title%/g, props.productName || '')
    .replace(/%price%/g, priceFormatted)
    .replace(/%sku%/g, props.productSku || '')
    .replace(/%category%/g, props.productCategory || '')
    .replace(/%brand%/g, props.productBrand || '')
    .replace(/%sitename%/g, props.siteName || 'Shop Gấu Bông');
}

/**
 * SEO Meta Box Component
 * Features:
 * - Product Snippet Preview (Google Rich Result)
 * - Focus Keyword with auto-suggest
 * - SEO Title with template variables
 * - Meta Description with fallback
 * - SEO Analysis Checklist
 * - Advanced Tab (Canonical, Robots)
 * - Social Sharing Tab (OG Image, Price)
 */
export function SEOMetaBox({
  data,
  onChange,
  productName = '',
  productPrice = 0,
  productSalePrice,
  productSku = '',
  productCategory = '',
  productBrand = '',
  productShortDescription = '',
  productDescription = '',
  productImage = '',
  productStockStatus = 'instock',
  productStockQuantity = 0,
  productRating = 5.0,
  productSlug = '',
  siteName = 'Shop Gấu Bông',
  hasRelatedProducts = false,
}: SEOMetaBoxProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'advanced' | 'social' | 'schema'>('general');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [seoTitleTemplate, setSeoTitleTemplate] = useState('');
  const [slugValidation, setSlugValidation] = useState<{ isValid: boolean; message?: string } | null>(null);
  const [slugDebounceTimer, setSlugDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-suggest focus keyword from product name
  const suggestedKeyword = useMemo(() => {
    if (productName) {
      // Extract key words from product name (remove common words)
      const words = productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !['the', 'and', 'or', 'for', 'with'].includes(w));
      return words.slice(0, 3).join(' ');
    }
    return '';
  }, [productName]);

  // Auto-generate SEO title from template (only when template changes)
  useEffect(() => {
    if (seoTitleTemplate && seoTitleTemplate.trim()) {
      const generated = replaceTemplateVariables(seoTitleTemplate, {
        data,
        onChange,
        productName,
        productPrice,
        productSalePrice,
        productSku,
        productCategory,
        productBrand,
        productShortDescription,
        productDescription,
        productImage,
        productStockStatus,
        productStockQuantity,
        productRating,
        productSlug,
        siteName,
      });
      if (generated && generated !== data.seoTitle) {
        onChange({ ...data, seoTitle: generated });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seoTitleTemplate]);

  // Auto-fill meta description from short description or description (only once on mount)
  useEffect(() => {
    if (!data.seoDescription) {
      let fallback = '';
      if (productShortDescription) {
        fallback = productShortDescription.substring(0, 160);
      } else if (productDescription) {
        fallback = productDescription.substring(0, 160).replace(/<[^>]*>/g, ''); // Strip HTML
      }
      if (fallback) {
        onChange({ ...data, seoDescription: fallback });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-generate slug from product name (only if slug is empty and productSlug is also empty)
  useEffect(() => {
    if (!data.slug && !productSlug && productName) {
      const slug = productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      onChange({ ...data, slug });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName]); // Only when productName changes

  // Validate slug real-time (debounced)
  useEffect(() => {
    if (slugDebounceTimer) {
      clearTimeout(slugDebounceTimer);
    }

    if (!data.slug || data.slug === productSlug) {
      setSlugValidation(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Only validate if slug is different from current productSlug
        if (data.slug && data.slug !== productSlug) {
          const response = await fetch(
            `/api/admin/products/validate-slug?slug=${encodeURIComponent(data.slug)}&excludeId=${productSlug || ''}`,
            { credentials: 'include' } // Include credentials for authentication
          );
          
          if (!response.ok) {
            // Authentication error or other error - skip validation silently
            setSlugValidation(null);
            return;
          }
          
          const result = await response.json();
          if (result.exists) {
            setSlugValidation({ isValid: false, message: 'Slug này đã tồn tại' });
          } else {
            setSlugValidation({ isValid: true });
          }
        } else {
          setSlugValidation(null);
        }
      } catch (error) {
        console.error('Error validating slug:', error);
        setSlugValidation(null);
      }
    }, 500); // Debounce 500ms

    setSlugDebounceTimer(timer);

    return () => {
      if (slugDebounceTimer) {
        clearTimeout(slugDebounceTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.slug, productSlug]);

  const updateField = (field: keyof SEOMetaBoxData, value: string | undefined) => {
    onChange({ ...data, [field]: value });
  };

  // SEO Analysis Checklist
  const seoChecks = useMemo(() => {
    const checks = {
      sku: {
        status: productSku ? 'good' : 'bad',
        label: 'SKU',
        message: productSku ? 'Đã có mã SKU' : 'Chưa có mã SKU',
      },
      price: {
        status: (productPrice > 0 || productSalePrice) ? 'good' : 'bad',
        label: 'Giá bán',
        message: (productPrice > 0 || productSalePrice) ? 'Đã nhập giá' : 'Chưa nhập giá',
      },
      image: {
        status: productImage ? 'good' : 'bad',
        label: 'Ảnh đại diện',
        message: productImage ? 'Đã có ảnh' : 'Chưa có ảnh',
      },
      content: {
        status: (() => {
          const hasContent = productDescription || productShortDescription;
          if (!hasContent) return 'bad';
          // Check if content contains focus keyword
          if (data.focusKeyword) {
            const keyword = data.focusKeyword.toLowerCase();
            const desc = (productDescription || productShortDescription || '').toLowerCase();
            return desc.includes(keyword) ? 'good' : 'warning';
          }
          return hasContent ? 'good' : 'warning';
        })(),
        label: 'Nội dung',
        message: (() => {
          const hasContent = productDescription || productShortDescription;
          if (!hasContent) return 'Thiếu mô tả sản phẩm';
          if (data.focusKeyword) {
            const keyword = data.focusKeyword.toLowerCase();
            const desc = (productDescription || productShortDescription || '').toLowerCase();
            return desc.includes(keyword) 
              ? 'Mô tả có chứa từ khóa' 
              : 'Mô tả chưa chứa từ khóa chính';
          }
          return 'Đã có mô tả';
        })(),
      },
      keyword: {
        status: data.focusKeyword ? 'good' : 'warning',
        label: 'Từ khóa chính',
        message: data.focusKeyword ? 'Đã nhập từ khóa' : 'Chưa nhập từ khóa',
      },
      seoTitle: {
        status: data.seoTitle ? 'good' : 'warning',
        label: 'SEO Title',
        message: data.seoTitle ? 'Đã có tiêu đề SEO' : 'Chưa có tiêu đề SEO',
      },
      seoDescription: {
        status: data.seoDescription ? 'good' : 'warning',
        label: 'Meta Description',
        message: data.seoDescription ? 'Đã có mô tả' : 'Chưa có mô tả',
      },
      internalLinks: {
        status: hasRelatedProducts ? 'good' : 'warning',
        label: 'Internal Links',
        message: hasRelatedProducts 
          ? 'Có sản phẩm liên quan' 
          : 'Chưa có sản phẩm liên quan',
      },
    };
    return checks;
  }, [productSku, productPrice, productSalePrice, productImage, productDescription, productShortDescription, data.focusKeyword, data.seoTitle, data.seoDescription]);

  // Get current price for display
  const displayPrice = productSalePrice || productPrice || 0;
  const priceFormatted = displayPrice > 0 
    ? `${displayPrice.toLocaleString('vi-VN')}₫` 
    : 'Liên hệ';

  // Get stock status text
  const stockStatusText = productStockStatus === 'instock' 
    ? 'Còn hàng' 
    : productStockStatus === 'outofstock' 
    ? 'Hết hàng' 
    : 'Đặt hàng trước';

  // SEO Title length (pixel width)
  const seoTitleLength = data.seoTitle ? getTextWidth(data.seoTitle) : 0;
  const seoDescriptionLength = data.seoDescription?.length || 0;

  // Breadcrumb from category
  const breadcrumb = productCategory ? `Shop Gấu Bông > ${productCategory}` : 'Shop Gấu Bông';

  // Generate Product Schema (JSON-LD) for preview
  const productSchema = useMemo(() => {
    const price = productSalePrice || productPrice || 0;
    const stockStatus = productStockStatus || (productStockQuantity > 0 ? 'instock' : 'outofstock');
    const availability = stockStatus === 'instock' ? 'InStock' : 
                        stockStatus === 'outofstock' ? 'OutOfStock' : 'PreOrder';
    
    const siteUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://shop-gaubong.com';
    const productUrl = `${siteUrl}/products/${data.slug || productSlug || 'product-slug'}`;
    
    // Extract size from variations if available (from ProductDataMetaBox)
    // Note: This is a preview, actual schema is generated in backend with full variation data
    const additionalProperties: Array<{ name: string; value: string }> = [];
    
    return generateProductSchema({
      name: productName || 'Sản phẩm',
      description: data.seoDescription || productShortDescription || productDescription || null,
      image: productImage || null,
      price: price > 0 ? String(price) : null,
      currency: 'VND',
      sku: productSku || null,
      availability,
      brand: productBrand || 'Shop Gấu Bông',
      category: productCategory || 'Gấu bông',
      url: productUrl,
      additionalProperties: additionalProperties.length > 0 ? additionalProperties : undefined,
    });
  }, [
    productName,
    productSalePrice,
    productPrice,
    productStockStatus,
    productStockQuantity,
    productImage,
    productSku,
    productBrand,
    productCategory,
    data.seoDescription,
    productShortDescription,
    productDescription,
    data.slug,
    productSlug,
  ]);

  // Format JSON for display
  const schemaJson = JSON.stringify(productSchema, null, 2);

  // Copy schema to clipboard
  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(schemaJson);
      alert('Đã sao chép Schema JSON-LD vào clipboard!');
    } catch (error) {
      console.error('Failed to copy schema:', error);
      alert('Không thể sao chép. Vui lòng copy thủ công.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tối ưu hóa Tìm kiếm (SEO)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1. Product Snippet Preview */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold mb-3">Xem trước kết quả tìm kiếm Google</h3>
          <div className="bg-white border rounded p-4 space-y-2">
            {/* Breadcrumb */}
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-4 h-4 bg-blue-500 rounded"></span>
              {breadcrumb}
            </div>
            
            {/* Title */}
            <div>
              <a href="#" className="text-blue-600 text-lg hover:underline">
                {data.seoTitle || productName || 'Tiêu đề sản phẩm'}
              </a>
            </div>
            
            {/* Rich Data */}
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {productRating.toFixed(1)}
                </span>
                <span>Giá: <strong>{priceFormatted}</strong></span>
                <span>Tình trạng: {stockStatusText}</span>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-700">
              {data.seoDescription || productShortDescription || 'Mô tả sản phẩm...'}
            </p>
          </div>
        </div>

        {/* 2. Length Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>SEO Title</span>
              <span className={seoTitleLength > 580 ? 'text-red-600' : ''}>
                ~{Math.round(seoTitleLength)}px / 580px (tối ưu)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor('title', seoTitleLength)}`}
                style={{ width: `${Math.min((seoTitleLength / 580) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Meta Description</span>
              <span className={seoDescriptionLength > 160 ? 'text-red-600' : ''}>
                {seoDescriptionLength} / 160 ký tự
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor('description', seoDescriptionLength)}`}
                style={{ width: `${Math.min((seoDescriptionLength / 160) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Tabs */}
        <div className="border-b">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('advanced')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'advanced'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Nâng cao
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'social'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Mạng xã hội
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'schema'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Schema Markup
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {/* Focus Keyword */}
            <div>
              <Label htmlFor="focusKeyword">Từ khóa chính (Focus Keyword)</Label>
              <Input
                id="focusKeyword"
                value={data.focusKeyword || ''}
                onChange={(e) => updateField('focusKeyword', e.target.value)}
                placeholder={suggestedKeyword || 'Nhập từ khóa SEO...'}
              />
              {suggestedKeyword && !data.focusKeyword && (
                <p className="text-xs text-gray-500 mt-1">
                  Gợi ý: <button
                    type="button"
                    onClick={() => updateField('focusKeyword', suggestedKeyword)}
                    className="text-blue-600 hover:underline"
                  >
                    {suggestedKeyword}
                  </button>
                </p>
              )}
            </div>

            {/* SEO Title */}
            <div>
              <Label htmlFor="seoTitle">Tiêu đề SEO (SEO Title)</Label>
              <div className="space-y-2">
                <Input
                  id="seoTitle"
                  value={data.seoTitle || ''}
                  onChange={(e) => updateField('seoTitle', e.target.value)}
                  placeholder="Tiêu đề SEO..."
                />
                <div>
                  <Label htmlFor="seoTitleTemplate" className="text-xs text-gray-600">
                    Template (sử dụng: %title%, %price%, %sku%, %category%, %brand%, %sitename%)
                  </Label>
                  <Input
                    id="seoTitleTemplate"
                    value={seoTitleTemplate}
                    onChange={(e) => {
                      setSeoTitleTemplate(e.target.value);
                      if (e.target.value) {
                        const generated = replaceTemplateVariables(e.target.value, {
                          data,
                          onChange,
                          productName,
                          productPrice,
                          productSalePrice,
                          productSku,
                          productCategory,
                          productBrand,
                          productShortDescription,
                          productDescription,
                          productImage,
                          productStockStatus,
                          productStockQuantity,
                          productRating,
                          productSlug,
                          siteName,
                        });
                        updateField('seoTitle', generated);
                      }
                    }}
                    placeholder="Mua %title% Mã %sku% Giá chỉ %price% - %sitename%"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">Đường dẫn tĩnh (Slug/URL)</Label>
              <Input
                id="slug"
                value={data.slug || productSlug || ''}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder="product-slug"
                className={slugValidation && !slugValidation.isValid ? 'border-red-500' : ''}
              />
              <div className="mt-1">
                <p className="text-xs text-gray-500">
                  URL: /products/{data.slug || productSlug || 'product-slug'}
                </p>
                {slugValidation && (
                  <p className={`text-xs mt-1 ${
                    slugValidation.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {slugValidation.isValid ? '✓ Slug hợp lệ' : `⚠ ${slugValidation.message}`}
                  </p>
                )}
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <Label htmlFor="seoDescription">Mô tả Meta (Meta Description)</Label>
              <Textarea
                id="seoDescription"
                value={data.seoDescription || ''}
                onChange={(e) => updateField('seoDescription', e.target.value)}
                rows={3}
                placeholder="Mô tả SEO (tối đa 160 ký tự)..."
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tự động lấy từ "Mô tả ngắn" nếu để trống
              </p>
            </div>

            {/* SEO Analysis Checklist */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Phân tích SEO</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(seoChecks).map(([key, check]) => {
                  const Icon = check.status === 'good' 
                    ? CheckCircle2 
                    : check.status === 'warning' 
                    ? AlertCircle 
                    : XCircle;
                  const color = check.status === 'good' 
                    ? 'text-green-600' 
                    : check.status === 'warning' 
                    ? 'text-orange-600' 
                    : 'text-red-600';
                  
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className={color}>{check.label}:</span>
                      <span className="text-gray-600">{check.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Canonical URL */}
            <div>
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                type="url"
                value={data.canonicalUrl || ''}
                onChange={(e) => updateField('canonicalUrl', e.target.value)}
                placeholder={`https://example.com/products/${data.slug || productSlug || 'product-slug'}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Link gốc (dùng khi sản phẩm này là biến thể copy)
              </p>
            </div>

            {/* Meta Robots */}
            <div>
              <Label htmlFor="robotsMeta">Meta Robots</Label>
              <Select
                value={data.robotsMeta || (productStockQuantity === 0 ? 'noindex, follow' : 'index, follow')}
                onValueChange={(value) => updateField('robotsMeta', value)}
              >
                <SelectTrigger id="robotsMeta">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">Index, Follow (Mặc định)</SelectItem>
                  <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                  <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                  <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {productStockQuantity === 0 && (
                  <span className="text-orange-600">
                    Gợi ý: Tự động đặt NoIndex khi hết hàng để tránh trải nghiệm xấu
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
            {/* OG Image */}
            <div>
              <Label>Ảnh chia sẻ (Open Graph Image)</Label>
              <div className="space-y-2">
                {data.ogImage ? (
                  <div className="relative">
                    <img
                      src={data.ogImage}
                      alt="OG Image"
                      className="w-full max-w-md h-48 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => updateField('ogImage', undefined)}
                      className="absolute top-2 right-2"
                    >
                      Xóa
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded p-8 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {productImage ? 'Sử dụng ảnh đại diện sản phẩm' : 'Chưa có ảnh'}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMediaModal(true)}
                    >
                      Upload ảnh riêng
                    </Button>
                  </div>
                )}
                {productImage && !data.ogImage && (
                  <p className="text-xs text-gray-500">
                    Mặc định: Sử dụng ảnh đại diện sản phẩm
                  </p>
                )}
              </div>
            </div>

            {/* Social Description */}
            <div>
              <Label htmlFor="socialDescription">Mô tả chia sẻ (Social Description)</Label>
              <Textarea
                id="socialDescription"
                value={data.socialDescription || ''}
                onChange={(e) => updateField('socialDescription', e.target.value)}
                rows={3}
                placeholder={`Đang giảm giá chỉ còn ${priceFormatted}! ${productShortDescription || ''}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tự động chèn giá vào mô tả khi chia sẻ
              </p>
            </div>
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold mb-1">Schema Markup (JSON-LD)</h4>
                <p className="text-xs text-gray-500">
                  Schema này được tự động generate và lưu vào database khi bạn lưu sản phẩm.
                  Google sẽ sử dụng schema này để hiển thị Rich Results với giá và tình trạng kho.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySchema}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Sao chép
              </Button>
            </div>

            <div className="border rounded-lg bg-gray-50 p-4">
              <div className="bg-white rounded border p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                  {schemaJson}
                </pre>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <Code className="w-4 h-4" />
                Mapping Dữ liệu
              </h5>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>name:</strong> Tên sản phẩm</p>
                <p><strong>description:</strong> Meta Description / Mô tả ngắn</p>
                <p><strong>sku:</strong> Mã SKU từ tab Kiểm kê kho hàng</p>
                <p><strong>image:</strong> Ảnh đại diện sản phẩm</p>
                <p><strong>brand:</strong> Thương hiệu (mặc định: Shop Gấu Bông)</p>
                <p><strong>category:</strong> Danh mục sản phẩm</p>
                <p><strong>offers.price:</strong> Giá bán / Giá Sale từ tab Dữ liệu sản phẩm</p>
                <p><strong>offers.availability:</strong> Tình trạng kho (InStock/OutOfStock)</p>
                {(productSchema as any).additionalProperty && (
                  <p><strong>additionalProperty:</strong> Size từ biến thể (nếu có)</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Lưu ý:</strong> Schema này được tự động generate ở backend khi lưu sản phẩm.
                Bạn không cần chỉnh sửa thủ công. Schema sẽ được inject vào HTML của trang sản phẩm
                dưới dạng JSON-LD để Google có thể đọc và hiển thị Rich Results.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Media Library Modal for OG Image */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={(items) => {
          const item = Array.isArray(items) ? items[0] : items;
          updateField('ogImage', item.thumbnail_url || item.url);
          updateField('ogImageId', item.id);
          setShowMediaModal(false);
        }}
        mode="single"
        buttonText="Chọn ảnh chia sẻ"
      />
    </Card>
  );
}
