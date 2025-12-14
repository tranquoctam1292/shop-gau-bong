'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface SEOData {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
}

interface SEOSectionProps {
  data: SEOData;
  onChange: (data: SEOData) => void;
  productName?: string; // Để suggest SEO title
  productSlug?: string; // Để suggest canonical URL
}

export function SEOSection({ data, onChange, productName, productSlug }: SEOSectionProps) {
  const { showToast } = useToastContext();
  const [keywordInput, setKeywordInput] = useState('');

  const updateField = (field: keyof SEOData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) {
      showToast('Vui lòng nhập keyword', 'error');
      return;
    }
    if (data.seoKeywords?.includes(keywordInput.trim())) {
      showToast('Keyword đã tồn tại', 'info');
      return;
    }
    updateField('seoKeywords', [...(data.seoKeywords || []), keywordInput.trim()]);
    showToast(`Đã thêm keyword "${keywordInput.trim()}"`, 'success');
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    updateField('seoKeywords', data.seoKeywords?.filter((k) => k !== keyword) || []);
    showToast(`Đã xóa keyword "${keyword}"`, 'success');
  };

  // Auto-suggest SEO title từ product name
  const suggestedTitle = productName 
    ? `${productName} | Shop Gấu Bông`
    : '';

  // Auto-suggest canonical URL từ slug
  const suggestedCanonical = productSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${productSlug}`
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO & Meta Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="seoTitle">SEO Title (Meta Title)</Label>
          <Input
            id="seoTitle"
            value={data.seoTitle || ''}
            onChange={(e) => updateField('seoTitle', e.target.value)}
            placeholder={suggestedTitle || 'Tiêu đề SEO (tối đa 60 ký tự)'}
            maxLength={60}
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.seoTitle?.length || 0}/60 ký tự
            {suggestedTitle && !data.seoTitle && (
              <button
                type="button"
                onClick={() => updateField('seoTitle', suggestedTitle)}
                className="ml-2 text-blue-600 hover:underline"
              >
                Sử dụng gợi ý
              </button>
            )}
          </p>
        </div>

        <div>
          <Label htmlFor="seoDescription">SEO Description (Meta Description)</Label>
          <Textarea
            id="seoDescription"
            value={data.seoDescription || ''}
            onChange={(e) => updateField('seoDescription', e.target.value)}
            rows={3}
            placeholder="Mô tả SEO (tối đa 160 ký tự)"
            maxLength={160}
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.seoDescription?.length || 0}/160 ký tự
          </p>
        </div>

        <div>
          <Label htmlFor="seoKeywords">SEO Keywords</Label>
          <div className="flex gap-2 mb-2">
            <Input
              id="seoKeywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Nhập keyword và nhấn Enter"
            />
            <Button type="button" onClick={addKeyword} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
          {data.seoKeywords && data.seoKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.seoKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="ogImage">Open Graph Image</Label>
          <Input
            id="ogImage"
            type="url"
            value={data.ogImage || ''}
            onChange={(e) => updateField('ogImage', e.target.value)}
            placeholder="https://example.com/og-image.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Hình ảnh hiển thị khi chia sẻ lên Facebook, Zalo (khuyến nghị: 1200x630px)
          </p>
        </div>

        <div>
          <Label htmlFor="canonicalUrl">Canonical URL</Label>
          <Input
            id="canonicalUrl"
            type="url"
            value={data.canonicalUrl || ''}
            onChange={(e) => updateField('canonicalUrl', e.target.value)}
            placeholder={suggestedCanonical || 'https://example.com/products/product-slug'}
          />
          <p className="text-xs text-gray-500 mt-1">
            URL chính thức của trang (để tránh duplicate content)
            {suggestedCanonical && !data.canonicalUrl && (
              <button
                type="button"
                onClick={() => updateField('canonicalUrl', suggestedCanonical)}
                className="ml-2 text-blue-600 hover:underline"
              >
                Sử dụng gợi ý
              </button>
            )}
          </p>
        </div>

        <div>
          <Label htmlFor="robotsMeta">Robots Meta Tag</Label>
          <select
            id="robotsMeta"
            value={data.robotsMeta || 'index, follow'}
            onChange={(e) => updateField('robotsMeta', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="index, follow">Index, Follow (Mặc định)</option>
            <option value="index, nofollow">Index, NoFollow</option>
            <option value="noindex, follow">NoIndex, Follow</option>
            <option value="noindex, nofollow">NoIndex, NoFollow</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Hướng dẫn công cụ tìm kiếm cách index trang này
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

