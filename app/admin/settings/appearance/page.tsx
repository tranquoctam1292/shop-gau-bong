/**
 * Appearance Settings Page
 * 
 * Admin page for managing site appearance settings:
 * - Header: Logo, Announcement Bar
 * - Footer: Copyright, Address, Social Links
 * - Scripts: Header Scripts, Footer Scripts
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaPicker, type MediaPickerValue } from '@/components/admin/media/MediaPicker';
import { useToastContext } from '@/components/providers/ToastProvider';
import { siteSettingsUpdateSchema, type SiteSettingsUpdateInput } from '@/lib/validations/siteSettings';
import type { SiteSettings } from '@/types/siteSettings';

type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'zalo' | 'tiktok' | 'twitter';

interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label?: string;
}

interface AppearanceFormData {
  header: {
    logo: MediaPickerValue | null;
    announcementBar: {
      enabled: boolean;
      text?: string;
      link?: string;
      linkText?: string;
    };
  };
  footer: {
    copyright?: string;
    address?: string;
    email?: string;
    phone?: string;
    socialLinks: SocialLink[];
  };
  scripts: {
    headerScripts?: string;
    footerScripts?: string;
  };
}

const socialPlatforms: Array<{ value: SocialPlatform; label: string }> = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter' },
];

export default function AppearanceSettingsPage() {
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<SiteSettings | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AppearanceFormData>({
    resolver: zodResolver(siteSettingsUpdateSchema),
    defaultValues: {
      header: {
        logo: null,
        announcementBar: {
          enabled: false,
        },
      },
      footer: {
        socialLinks: [],
      },
      scripts: {},
    },
  });

  const watchedHeader = watch('header');
  const watchedFooter = watch('footer');
  const watchedScripts = watch('scripts');

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/site', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Không thể tải cấu hình');
        }

        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data as SiteSettings;
          setInitialData(data);

          // Map to form data
          reset({
            header: {
              logo: data.header.logo
                ? {
                    _id: data.header.logo.id,
                    url: data.header.logo.url,
                    name: data.header.logo.name,
                    type: 'image',
                  }
                : null,
              announcementBar: data.header.announcementBar,
            },
            footer: {
              copyright: data.footer.copyright,
              address: data.footer.address,
              email: data.footer.email,
              phone: data.footer.phone,
              socialLinks: data.footer.socialLinks,
            },
            scripts: data.scripts,
          });
        }
      } catch (error) {
        console.error('[Appearance Settings] Fetch error:', error);
        showToast('Không thể tải cấu hình. Vui lòng thử lại.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset, showToast]);

  // Handle form submission
  const onSubmit = async (data: AppearanceFormData) => {
    setSaving(true);
    try {
      // Map form data to API format
      const apiData: SiteSettingsUpdateInput = {
        header: {
          logo: data.header.logo
            ? {
                _id: data.header.logo._id,
                url: data.header.logo.url,
                name: data.header.logo.name,
                alt: data.header.logo.name,
              }
            : null,
          announcementBar: data.header.announcementBar,
        },
        footer: {
          copyright: data.footer.copyright,
          address: data.footer.address,
          email: data.footer.email,
          phone: data.footer.phone,
          socialLinks: data.footer.socialLinks,
        },
        scripts: data.scripts,
      };

      const response = await fetch('/api/admin/settings/site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể cập nhật cấu hình');
      }

      showToast('Cập nhật cấu hình thành công!', 'success');
    } catch (error) {
      console.error('[Appearance Settings] Save error:', error);
      showToast(
        error instanceof Error ? error.message : 'Không thể cập nhật cấu hình',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle social link management
  const addSocialLink = () => {
    const currentLinks = watchedFooter?.socialLinks || [];
    setValue('footer.socialLinks', [
      ...currentLinks,
      { platform: 'facebook', url: '', label: '' },
    ]);
  };

  const removeSocialLink = (index: number) => {
    const currentLinks = watchedFooter?.socialLinks || [];
    setValue(
      'footer.socialLinks',
      currentLinks.filter((_, i) => i !== index)
    );
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string | SocialPlatform) => {
    const currentLinks = watchedFooter?.socialLinks || [];
    const updated = [...currentLinks];
    updated[index] = { ...updated[index], [field]: value };
    setValue('footer.socialLinks', updated);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt Giao diện</h1>
        <p className="text-text-muted mt-1">
          Quản lý logo, thanh thông báo, footer và scripts của website
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="header" className="space-y-6">
          <TabsList>
            <TabsTrigger value="header">Header</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
          </TabsList>

          {/* Header Tab */}
          <TabsContent value="header" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>Logo hiển thị trên header</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MediaPicker
                  value={watchedHeader?.logo || undefined}
                  onChange={(value) => {
                    setValue('header.logo', (value as MediaPickerValue) || null);
                  }}
                  type="image"
                  label="Logo"
                />
                {errors.header?.logo && (
                  <p className="text-sm text-destructive">
                    {errors.header.logo.message as string}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thanh Thông Báo</CardTitle>
                <CardDescription>Thanh thông báo hiển thị ở đầu trang</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="announcement-enabled">Bật thanh thông báo</Label>
                  <Switch
                    id="announcement-enabled"
                    checked={watchedHeader?.announcementBar?.enabled || false}
                    onCheckedChange={(checked) => {
                      setValue('header.announcementBar.enabled', checked);
                    }}
                  />
                </div>

                {watchedHeader?.announcementBar?.enabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="announcement-text">Nội dung</Label>
                      <Input
                        id="announcement-text"
                        {...register('header.announcementBar.text')}
                        placeholder="Ví dụ: Miễn phí vận chuyển cho đơn hàng trên 500.000đ"
                      />
                      {errors.header?.announcementBar?.text && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.header.announcementBar.text.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="announcement-link">Link (tùy chọn)</Label>
                      <Input
                        id="announcement-link"
                        {...register('header.announcementBar.link')}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>

                    <div>
                      <Label htmlFor="announcement-link-text">Text link (tùy chọn)</Label>
                      <Input
                        id="announcement-link-text"
                        {...register('header.announcementBar.linkText')}
                        placeholder="Xem thêm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin Footer</CardTitle>
                <CardDescription>Thông tin hiển thị ở footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="footer-copyright">Bản quyền</Label>
                  <Input
                    id="footer-copyright"
                    {...register('footer.copyright')}
                    placeholder="© 2024 Shop Gấu Bông. All rights reserved."
                  />
                </div>

                <div>
                  <Label htmlFor="footer-address">Địa chỉ</Label>
                  <Textarea
                    id="footer-address"
                    {...register('footer.address')}
                    placeholder="123 Đường ABC, Quận XYZ, TP. Hà Nội"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="footer-email">Email</Label>
                  <Input
                    id="footer-email"
                    {...register('footer.email')}
                    type="email"
                    placeholder="info@shopgaubong.com"
                  />
                  {errors.footer?.email && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.footer.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="footer-phone">Số điện thoại</Label>
                  <Input
                    id="footer-phone"
                    {...register('footer.phone')}
                    placeholder="1900-xxxx"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liên kết Mạng xã hội</CardTitle>
                <CardDescription>Thêm các liên kết mạng xã hội</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(watchedFooter?.socialLinks || []).map((link, index) => (
                  <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label>Platform</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={link.platform}
                          onChange={(e) =>
                            updateSocialLink(index, 'platform', e.target.value as SocialPlatform)
                          }
                        >
                          {socialPlatforms.map((platform) => (
                            <option key={platform.value} value={platform.value}>
                              {platform.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>URL</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          placeholder="https://..."
                          type="url"
                        />
                      </div>
                      <div>
                        <Label>Label (tùy chọn)</Label>
                        <Input
                          value={link.label || ''}
                          onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                          placeholder="Facebook"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                      className="mt-6"
                    >
                      ×
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addSocialLink}>
                  + Thêm liên kết
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scripts Tab */}
          <TabsContent value="scripts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Header Scripts</CardTitle>
                <CardDescription>
                  Scripts được inject vào thẻ &lt;head&gt; (ví dụ: Google Analytics, Facebook Pixel)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('scripts.headerScripts')}
                  placeholder='<script>...</script>'
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Footer Scripts</CardTitle>
                <CardDescription>
                  Scripts được inject trước thẻ đóng &lt;/body&gt;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('scripts.footerScripts')}
                  placeholder='<script>...</script>'
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
}

