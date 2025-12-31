'use client';

import { useState } from 'react';
import { useSEOSettings, useUpdateSEOSettings } from '@/lib/hooks/useSEO';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SEOSettings } from '@/types/seo';

interface GlobalSEOFormProps {
  className?: string;
}

export function GlobalSEOForm({ className }: GlobalSEOFormProps) {
  const { data, isLoading, error } = useSEOSettings();
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSEOSettings();

  const [formData, setFormData] = useState<Partial<SEOSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when settings load
  const settings = data;

  const handleChange = <K extends keyof SEOSettings>(
    key: K,
    value: SEOSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleOrganizationChange = (
    key: keyof NonNullable<SEOSettings['organization']>,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      organization: {
        name: settings?.organization?.name || '',
        url: settings?.organization?.url || '',
        ...settings?.organization,
        ...prev.organization,
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleAddressChange = (
    key: keyof NonNullable<NonNullable<SEOSettings['organization']>['address']>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      organization: {
        name: settings?.organization?.name || '',
        url: settings?.organization?.url || '',
        ...settings?.organization,
        ...prev.organization,
        address: {
          addressCountry: settings?.organization?.address?.addressCountry || 'VN',
          ...settings?.organization?.address,
          ...prev.organization?.address,
          [key]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData, {
      onSuccess: () => {
        setHasChanges(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Đang tải cài đặt...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
        <p className="text-red-500">Lỗi khi tải cài đặt SEO</p>
      </div>
    );
  }

  const currentSettings = { ...settings, ...formData };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-8', className)}>
      {/* Title Templates */}
      <section className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Mẫu tiêu đề</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sử dụng các biến: %title%, %price%, %category%, %site%
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mẫu tiêu đề trang
            </label>
            <input
              type="text"
              value={currentSettings.titleTemplate || ''}
              onChange={(e) => handleChange('titleTemplate', e.target.value)}
              placeholder="%title% | Shop Gấu Bông"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mẫu tiêu đề sản phẩm
            </label>
            <input
              type="text"
              value={currentSettings.productTitleTemplate || ''}
              onChange={(e) => handleChange('productTitleTemplate', e.target.value)}
              placeholder="Mua %title% - %price% | Shop Gấu Bông"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Xác minh công cụ tìm kiếm</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Site Verification
            </label>
            <input
              type="text"
              value={currentSettings.googleVerification || ''}
              onChange={(e) => handleChange('googleVerification', e.target.value)}
              placeholder="Mã xác minh Google"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lấy từ Google Search Console
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bing Site Verification
            </label>
            <input
              type="text"
              value={currentSettings.bingVerification || ''}
              onChange={(e) => handleChange('bingVerification', e.target.value)}
              placeholder="Mã xác minh Bing"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Default OG Image */}
      <section className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Hình ảnh mặc định</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL hình ảnh OG mặc định
          </label>
          <input
            type="url"
            value={currentSettings.defaultOgImage || ''}
            onChange={(e) => handleChange('defaultOgImage', e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Hình ảnh hiển thị khi chia sẻ trên mạng xã hội (khuyến nghị 1200x630px)
          </p>
        </div>
      </section>

      {/* Organization Schema */}
      <section className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Thông tin doanh nghiệp (Schema.org)</h3>
        <p className="text-sm text-gray-500 mb-4">
          Thông tin này sẽ được sử dụng cho Schema.org Organization
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên doanh nghiệp *
            </label>
            <input
              type="text"
              value={currentSettings.organization?.name || ''}
              onChange={(e) => handleOrganizationChange('name', e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL website *
            </label>
            <input
              type="url"
              value={currentSettings.organization?.url || ''}
              onChange={(e) => handleOrganizationChange('url', e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL logo
            </label>
            <input
              type="url"
              value={currentSettings.organization?.logo || ''}
              onChange={(e) => handleOrganizationChange('logo', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={currentSettings.organization?.phone || ''}
              onChange={(e) => handleOrganizationChange('phone', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={currentSettings.organization?.email || ''}
              onChange={(e) => handleOrganizationChange('email', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Địa chỉ</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ đường
              </label>
              <input
                type="text"
                value={currentSettings.organization?.address?.streetAddress || ''}
                onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quận/Huyện
              </label>
              <input
                type="text"
                value={currentSettings.organization?.address?.addressLocality || ''}
                onChange={(e) => handleAddressChange('addressLocality', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tỉnh/Thành phố
              </label>
              <input
                type="text"
                value={currentSettings.organization?.address?.addressRegion || ''}
                onChange={(e) => handleAddressChange('addressRegion', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quốc gia *
              </label>
              <input
                type="text"
                value={currentSettings.organization?.address?.addressCountry || 'VN'}
                onChange={(e) => handleAddressChange('addressCountry', e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Social Profiles */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Mạng xã hội</h4>
          <textarea
            value={(currentSettings.organization?.socialProfiles || []).join('\n')}
            onChange={(e) =>
              handleOrganizationChange(
                'socialProfiles',
                e.target.value.split('\n').filter((url) => url.trim())
              )
            }
            placeholder="https://facebook.com/shopgaubong&#10;https://instagram.com/shopgaubong"
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mỗi URL trên một dòng
          </p>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4">
        {hasChanges && (
          <span className="text-sm text-yellow-600">
            Có thay đổi chưa lưu
          </span>
        )}
        <button
          type="submit"
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu cài đặt
        </button>
      </div>
    </form>
  );
}

export default GlobalSEOForm;
