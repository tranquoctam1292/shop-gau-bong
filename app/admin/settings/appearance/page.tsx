/**
 * Appearance Settings Page
 * 
 * Admin page for managing site appearance settings:
 * - Header: Logo, Announcement Bar
 * - Footer: Copyright, Address, Social Links
 * - Scripts: Header Scripts, Footer Scripts
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SITE_CONFIG } from '@/lib/constants/config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MediaPicker, type MediaPickerValue } from '@/components/admin/media/MediaPicker';
import { useToastContext } from '@/components/providers/ToastProvider';
import { siteSettingsUpdateSchema, type SiteSettingsUpdateInput } from '@/lib/validations/siteSettings';
import { AdminRole } from '@/types/admin';
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
    logoAlt?: string; // Alt text for logo (SEO)
    siteTitle?: string; // Custom site title (optional, falls back to SITE_CONFIG.name)
    announcementBar: {
      enabled: boolean;
      text?: string;
      link?: string;
      linkText?: string;
    };
  };
  footer: {
    copyright?: string;
    description?: string; // Brand description for footer
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
  const { data: session } = useSession();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<SiteSettings | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [previewDarkMode, setPreviewDarkMode] = useState(false); // ✅ LIVE PREVIEW: Dark/Light background toggle
  
  // Check if user is SUPER_ADMIN (only SUPER_ADMIN can update scripts)
  const isSuperAdmin = (session?.user as { role?: AdminRole })?.role === AdminRole.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<AppearanceFormData>({
    resolver: zodResolver(siteSettingsUpdateSchema),
    defaultValues: {
      header: {
        logo: null,
        logoAlt: '',
        siteTitle: '',
        announcementBar: {
          enabled: false,
          text: undefined,
          link: undefined,
          linkText: undefined,
        },
      },
      footer: {
        copyright: '',
        description: '',
        address: '',
        email: '',
        phone: '',
        socialLinks: [],
      },
      scripts: {
        headerScripts: undefined,
        footerScripts: undefined,
      },
    },
  });

  const watchedHeader = watch('header');
  const watchedFooter = watch('footer');
  const watchedScripts = watch('scripts');
  
  // ✅ UNSAVED CHANGES WARNING: Track form dirty state for beforeunload warning
  const isDirtyRef = useRef(false);
  
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);
  
  // ✅ UNSAVED CHANGES WARNING: Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Standard way to show browser warning
        e.preventDefault();
        // Modern browsers ignore custom message, but we set it anyway
        e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
                    _id: data.header.logo.id, // ✅ FIX: Map `id` from API to `_id` for MediaPicker compatibility
                    url: data.header.logo.url,
                    name: data.header.logo.name,
                    type: 'image',
                    thumbnail_url: data.header.logo.url, // Use url as thumbnail
                  }
                : null,
              logoAlt: data.header.logo?.alt || '', // Separate field for alt text
              siteTitle: data.header.siteTitle || '', // Custom site title
              announcementBar: {
                enabled: data.header.announcementBar?.enabled ?? false,
                text: data.header.announcementBar?.text || undefined,
                link: data.header.announcementBar?.link || undefined,
                linkText: data.header.announcementBar?.linkText || undefined,
              },
            },
            footer: {
              copyright: data.footer.copyright || '', // ✅ FIX: Convert null/undefined to empty string for form
              description: data.footer.description || '', // ✅ FIX: Convert null/undefined to empty string for form
              address: data.footer.address || '',
              email: data.footer.email || '',
              phone: data.footer.phone || '',
              socialLinks: data.footer.socialLinks || [],
            },
            scripts: data.scripts || {},
          });
        }
      } catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('[Appearance Settings] Fetch error:', error);
        }
        showToast('Không thể tải cấu hình. Vui lòng thử lại.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset, showToast]);

  // Handle form submission
  const onSubmit = async (data: AppearanceFormData) => {
    // Log in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('[Appearance Settings] onSubmit called with data:', data);
    }
    setSaving(true);
    try {
      // Map form data to API format
      const apiData: SiteSettingsUpdateInput = {
        header: {
          // ✅ IMAGE DATA FIX: Ensure URL is always saved (not just _id)
          // MediaPicker returns object with _id, url, name, type
          // Frontend needs URL directly to render image
          logo: data.header.logo && data.header.logo.url
            ? {
                _id: data.header.logo._id, // ✅ FIX: Use `_id` from MediaPicker (MediaPickerValue always has `_id`)
                url: data.header.logo.url, // Ensure URL is saved
                name: data.header.logo.name,
                alt: data.header.logoAlt || data.header.logo.name, // Use logoAlt from form or fallback to name
              }
            : null,
          siteTitle: data.header.siteTitle || undefined, // Custom site title (optional)
          announcementBar: {
            enabled: data.header.announcementBar?.enabled ?? false,
            text: data.header.announcementBar?.text || undefined,
            link: data.header.announcementBar?.link || undefined,
            linkText: data.header.announcementBar?.linkText || undefined,
          },
        },
        footer: {
          copyright: data.footer.copyright?.trim() || undefined, // ✅ FIX: Trim and convert null/empty to undefined
          description: data.footer.description?.trim() || undefined, // ✅ FIX: Convert null/empty to undefined
          address: data.footer.address?.trim() || undefined,
          email: data.footer.email?.trim() || undefined,
          phone: data.footer.phone?.trim() || undefined,
          // ✅ UX FIX: Filter out social links with empty URL or invalid platform before saving
          // Only save links that have both platform and URL filled
          socialLinks: data.footer.socialLinks.filter((link) => 
            link.platform && link.url.trim() !== ''
          ),
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

      const result = await response.json();
      if (result.success && result.data) {
        // ✅ FIX: Reset form with new data to clear dirty state
        const updatedData = result.data as SiteSettings;
        reset({
          header: {
            logo: updatedData.header.logo
              ? {
                  _id: updatedData.header.logo.id, // ✅ FIX: API returns `id`, form needs `_id`
                  url: updatedData.header.logo.url,
                  name: updatedData.header.logo.name,
                  type: 'image', // ✅ FIX: Add type field for MediaPicker compatibility
                  thumbnail_url: updatedData.header.logo.url, // Use url as thumbnail
                }
              : null,
            logoAlt: updatedData.header.logo?.alt || '',
            siteTitle: updatedData.header.siteTitle || '',
            announcementBar: {
              enabled: updatedData.header.announcementBar?.enabled ?? false,
              text: updatedData.header.announcementBar?.text || undefined,
              link: updatedData.header.announcementBar?.link || undefined,
              linkText: updatedData.header.announcementBar?.linkText || undefined,
            },
          },
          footer: {
            copyright: updatedData.footer.copyright || '',
            description: updatedData.footer.description || '', // ✅ FIX: Convert null/undefined to empty string for form
            address: updatedData.footer.address || '',
            email: updatedData.footer.email || '',
            phone: updatedData.footer.phone || '',
            socialLinks: updatedData.footer.socialLinks || [],
          },
          scripts: updatedData.scripts,
        });
      }

      showToast('Cập nhật cấu hình thành công!', 'success');
    } catch (error) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('[Appearance Settings] Save error:', error);
      }
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
    ], { shouldDirty: true }); // ✅ FIX: Mark form as dirty when adding social link
  };

  const removeSocialLink = (index: number) => {
    const currentLinks = watchedFooter?.socialLinks || [];
    setValue(
      'footer.socialLinks',
      currentLinks.filter((_, i) => i !== index),
      { shouldDirty: true } // ✅ FIX: Mark form as dirty when removing social link
    );
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string | SocialPlatform) => {
    const currentLinks = watchedFooter?.socialLinks || [];
    const updated = [...currentLinks];
    updated[index] = { ...updated[index], [field]: value };
    setValue('footer.socialLinks', updated, { shouldDirty: true }); // ✅ FIX: Mark form as dirty when updating social link
  };

  // ✅ LOADING STATE: Show skeleton loader while fetching initial data
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" /> {/* Tabs */}
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // ✅ TAB ERROR INDICATOR: Check if each tab has errors
  const hasHeaderErrors = Boolean(
    errors.header?.logo || 
    errors.header?.announcementBar?.text || 
    errors.header?.announcementBar?.link
  );
  
  const hasFooterErrors = Boolean(
    errors.footer?.copyright ||
    errors.footer?.email ||
    errors.footer?.socialLinks ||
    // ✅ FIX: Check if any social link item has errors
    (errors.footer?.socialLinks && 
     Array.isArray(errors.footer.socialLinks) && 
     errors.footer.socialLinks.some((linkError: any) => linkError !== undefined && linkError !== null))
  );
  
  const hasScriptsErrors = Boolean(
    errors.scripts?.headerScripts ||
    errors.scripts?.footerScripts
  );
  
  // ✅ RESTORE DEFAULTS: Default form values
  const defaultFormValues: AppearanceFormData = {
    header: {
      logo: null,
      logoAlt: '',
      siteTitle: '', // ✅ FIX: Include siteTitle in default values
      announcementBar: {
        enabled: false,
      },
    },
    footer: {
      copyright: `© ${new Date().getFullYear()} Shop Gấu Bông. All rights reserved.`,
      description: 'Shop Gấu Bông - Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất.',
      socialLinks: [],
    },
    scripts: {},
  };
  
  const handleRestoreDefaults = () => {
    reset(defaultFormValues);
    setShowRestoreDialog(false);
    showToast('Đã khôi phục về giá trị mặc định', 'success');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt Giao diện</h1>
        <p className="text-text-muted mt-1">
          Quản lý logo, thanh thông báo, footer và scripts của website
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        // ✅ FIX: Handle validation errors with detailed logging (development only)
        // ✅ FIX: Sanitize errors before stringify to avoid circular reference errors
        if (process.env.NODE_ENV === 'development') {
          // Helper to safely stringify objects with circular references
          const safeStringify = (obj: unknown, space?: number): string => {
            const seen = new WeakSet();
            return JSON.stringify(obj, (key, value) => {
              // Skip DOM elements and React refs
              if (value && typeof value === 'object') {
                if (value instanceof HTMLElement || value instanceof Element) {
                  return '[HTMLElement]';
                }
                if (seen.has(value)) {
                  return '[Circular]';
                }
                seen.add(value);
              }
              return value;
            }, space);
          };
          
          try {
            console.error('[Appearance Settings] Validation errors:', safeStringify(errors, 2));
            // Only log form values, not refs
            const formValues = watch();
            const sanitizedValues = {
              header: {
                logo: formValues.header?.logo ? { _id: formValues.header.logo._id, url: formValues.header.logo.url, name: formValues.header.logo.name } : null,
                logoAlt: formValues.header?.logoAlt,
                siteTitle: formValues.header?.siteTitle,
                announcementBar: formValues.header?.announcementBar,
              },
              footer: {
                copyright: formValues.footer?.copyright,
                description: formValues.footer?.description,
                address: formValues.footer?.address,
                email: formValues.footer?.email,
                phone: formValues.footer?.phone,
                socialLinks: formValues.footer?.socialLinks,
              },
              scripts: formValues.scripts,
            };
            console.error('[Appearance Settings] Form data:', safeStringify(sanitizedValues, 2));
          } catch (e) {
            console.error('[Appearance Settings] Error logging:', e);
          }
        }
        
        if (Object.keys(errors).length > 0) {
          // Find first error message with detailed path
          const getFirstError = (errs: Record<string, unknown>): string => {
            for (const key in errs) {
              const error = errs[key];
              // Check if error has message property
              if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
                return `${key}: ${error.message}`;
              }
              // Recursively check nested errors
              if (typeof error === 'object' && error !== null && !Array.isArray(error)) {
                const nested = getFirstError(error as Record<string, unknown>);
                if (nested) return nested;
              }
            }
            return 'Vui lòng kiểm tra lại các trường có lỗi';
          };
          
          const errorMessage = getFirstError(errors as Record<string, unknown>);
          showToast(errorMessage, 'error');
          
          // Scroll to first error field
          const firstErrorField = Object.keys(errors)[0];
          const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                         document.querySelector(`#${firstErrorField}`) ||
                         document.querySelector(`[id*="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      })}>
        <Tabs defaultValue="header" className="space-y-6">
          <TabsList>
            {/* ✅ TAB ERROR INDICATOR: Show error indicator on tabs with validation errors */}
            <TabsTrigger 
              value="header"
              className={hasHeaderErrors ? 'text-destructive' : ''}
            >
              Header
              {hasHeaderErrors && <span className="ml-1">●</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="footer"
              className={hasFooterErrors ? 'text-destructive' : ''}
            >
              Footer
              {hasFooterErrors && <span className="ml-1">●</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="scripts"
              className={hasScriptsErrors ? 'text-destructive' : ''}
            >
              Scripts
              {hasScriptsErrors && <span className="ml-1">●</span>}
            </TabsTrigger>
          </TabsList>

          {/* Header Tab */}
          <TabsContent value="header" className="space-y-6">
            {/* ✅ LIVE PREVIEW: Header Preview Component */}
            {(() => {
              // HeaderPreview Component - Real-time preview of Logo and Branding
              const previewLogo = watchedHeader?.logo;
              const previewSiteTitle = watchedHeader?.siteTitle || SITE_CONFIG.name;
              const previewLogoAlt = watchedHeader?.logoAlt || previewLogo?.name || 'Logo';
              
              // Split site title to maintain color styling (same logic as Header.tsx)
              let titleParts: string[] = [];
              let splitPoint = '';
              
              if (previewSiteTitle.includes('Gấu Bông')) {
                titleParts = previewSiteTitle.split('Gấu Bông');
                splitPoint = 'Gấu Bông';
              } else if (previewSiteTitle.includes('GấuBông')) {
                titleParts = previewSiteTitle.split('GấuBông');
                splitPoint = 'GấuBông';
              } else {
                const words = previewSiteTitle.split(' ');
                if (words.length > 1) {
                  titleParts = [words[0], words.slice(1).join(' ')];
                } else {
                  titleParts = [previewSiteTitle];
                }
              }
              
              return (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Xem trước giao diện Header</CardTitle>
                        <CardDescription>
                          Xem trước cách Logo và thương hiệu hiển thị trên Header
                        </CardDescription>
                      </div>
                      {/* Dark/Light Background Toggle */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDarkMode(!previewDarkMode)}
                        className="flex items-center gap-2"
                      >
                        {previewDarkMode ? (
                          <>
                            <Sun className="w-4 h-4" />
                            Nền sáng
                          </>
                        ) : (
                          <>
                            <Moon className="w-4 h-4" />
                            Nền tối
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Preview Container - Simulates Header Layout */}
                    <div 
                      className={`
                        relative border-2 border-dashed rounded-lg p-6 transition-colors duration-300
                        ${previewDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
                      `}
                    >
                      {/* Simulated Header Bar */}
                      <div className={`
                        py-4 border-b transition-colors duration-300
                        ${previewDarkMode ? 'border-gray-700' : 'border-primary/5'}
                      `}>
                        <div className="flex items-center gap-4 md:gap-8">
                          {/* Logo Preview - Copy exact layout from Header.tsx */}
                          <div className="flex items-center gap-2 flex-shrink-0 group">
                            {previewLogo?.url ? (
                              <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 max-h-12">
                                <Image
                                  src={previewLogo.url}
                                  alt={previewLogoAlt}
                                  fill
                                  className="object-contain transition-transform group-hover:scale-110"
                                  sizes="(max-width: 768px) 40px, 48px"
                                />
                              </div>
                            ) : (
                              <div className={`
                                w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-full 
                                flex items-center justify-center text-2xl transition-transform group-hover:rotate-12
                                ${previewDarkMode ? 'text-primary' : 'text-primary'}
                              `}>
                                🧸
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className={`
                                font-logo text-xl md:text-2xl font-extrabold leading-none tracking-tight
                                ${previewDarkMode ? 'text-white' : 'text-primary'}
                              `}>
                                {titleParts[0]}
                                {titleParts.length > 1 && splitPoint && (
                                  <>
                                    {splitPoint}
                                    <span className={previewDarkMode ? 'text-gray-300' : 'text-text-main'}>
                                      {titleParts[1]}
                                    </span>
                                  </>
                                )}
                                {titleParts.length > 1 && !splitPoint && (
                                  <span className={previewDarkMode ? 'text-gray-300' : 'text-text-main'}>
                                    {' '}{titleParts[1]}
                                  </span>
                                )}
                                {titleParts.length === 1 && (
                                  <span className={previewDarkMode ? 'text-gray-300' : 'text-text-main'}>
                                    {titleParts[0]}
                                  </span>
                                )}
                              </span>
                              <span className={`
                                text-[10px] uppercase tracking-widest font-bold hidden md:block
                                ${previewDarkMode ? 'text-gray-400' : 'text-text-muted'}
                              `}>
                                Soft & Cute
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Preview Info */}
                      <div className="mt-4 text-xs text-muted-foreground">
                        <p>💡 Preview này cập nhật theo thời gian thực khi bạn thay đổi Logo hoặc Tên thương hiệu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>Logo hiển thị trên header</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MediaPicker
                  value={watchedHeader?.logo || undefined}
                  onChange={(value) => {
                    setValue('header.logo', (value as MediaPickerValue) || null, { shouldDirty: true }); // ✅ FIX: Mark form as dirty when changing logo
                    // Clear alt text if logo is removed
                    if (!value) {
                      setValue('header.logoAlt', '', { shouldDirty: true });
                    }
                  }}
                  type="image"
                  label="Logo"
                />
                {errors.header?.logo && (
                  <p className="text-sm text-destructive">
                    {errors.header.logo.message as string}
                  </p>
                )}
                
                {/* ✅ SEO: Alt Text Input for Logo */}
                {watchedHeader?.logo && (
                  <div>
                    <Label htmlFor="logo-alt">Alt Text (SEO)</Label>
                    <Input
                      id="logo-alt"
                      placeholder="Mô tả logo cho SEO (ví dụ: Logo Shop Gấu Bông)"
                      value={watchedHeader.logoAlt || ''}
                      onChange={(e) => setValue('header.logoAlt', e.target.value, { shouldDirty: true })} // ✅ FIX: Use controlled input with setValue (removed register to avoid dual-control conflict)
                    />
                    {errors.header?.logoAlt && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.header.logoAlt.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Mô tả ngắn gọn về logo để tối ưu SEO và accessibility
                    </p>
                  </div>
                )}

                {/* ✅ BRANDING: Site Title Input */}
                <div>
                  <Label htmlFor="site-title">Tên thương hiệu</Label>
                  <Input
                    id="site-title"
                    {...register('header.siteTitle')}
                    placeholder={SITE_CONFIG.name}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Để trống sẽ sử dụng tên mặc định của website ({SITE_CONFIG.name})
                  </p>
                </div>
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
                      setValue('header.announcementBar.enabled', checked, { shouldDirty: true }); // ✅ FIX: Mark form as dirty when toggling announcement
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
                  <Label htmlFor="footer-description">Mô tả thương hiệu</Label>
                  <Textarea
                    id="footer-description"
                    {...register('footer.description')}
                    placeholder="Shop Gấu Bông - Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mô tả ngắn gọn về thương hiệu hiển thị ở cột đầu tiên của footer
                  </p>
                </div>

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
                  <Label htmlFor="footer-email">Email liên hệ</Label>
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
                {(watchedFooter?.socialLinks || []).map((link, index) => {
                  // ✅ FIX: Get validation errors for this specific social link
                  const linkErrors = errors.footer?.socialLinks?.[index];
                  const hasLinkErrors = Boolean(linkErrors);
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex gap-2 items-start p-4 border rounded-lg ${
                        hasLinkErrors ? 'border-destructive bg-destructive/5' : ''
                      }`}
                    >
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label>Platform *</Label>
                          {/* ✅ UX: Use Shadcn Select instead of native select */}
                          <Select
                            value={link.platform}
                            onValueChange={(value) =>
                              updateSocialLink(index, 'platform', value as SocialPlatform)
                            }
                          >
                            <SelectTrigger className={linkErrors?.platform ? 'border-destructive' : ''}>
                              <SelectValue placeholder="Chọn platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {socialPlatforms.map((platform) => (
                                <SelectItem key={platform.value} value={platform.value}>
                                  {platform.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* ✅ FIX: Display error for platform field */}
                          {linkErrors?.platform && (
                            <p className="text-sm text-destructive mt-1">
                              {linkErrors.platform.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>URL</Label>
                          <Input
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                            placeholder="https://..."
                            type="url"
                            className={linkErrors?.url ? 'border-destructive' : ''}
                          />
                          {/* ✅ FIX: Display error for URL field */}
                          {linkErrors?.url && (
                            <p className="text-sm text-destructive mt-1">
                              {linkErrors.url.message}
                            </p>
                          )}
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
                        aria-label="Xóa liên kết"
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}

                <Button type="button" variant="outline" onClick={addSocialLink}>
                  + Thêm liên kết
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scripts Tab */}
          <TabsContent value="scripts" className="space-y-6">
            {/* 🔒 SECURITY WARNING: Only SUPER_ADMIN can update scripts */}
            {!isSuperAdmin && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600 text-lg">⚠️</div>
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 mb-1">
                        Chỉ SUPER_ADMIN mới được cập nhật scripts
                      </p>
                      <p className="text-sm text-yellow-800">
                        Bạn không có quyền cập nhật Header Scripts và Footer Scripts. 
                        Chỉ SUPER_ADMIN mới có thể thêm các scripts như Google Analytics, Facebook Pixel, v.v.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  disabled={!isSuperAdmin}
                />
                {!isSuperAdmin && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Bạn cần quyền SUPER_ADMIN để chỉnh sửa scripts này
                  </p>
                )}
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
                  disabled={!isSuperAdmin}
                />
                {!isSuperAdmin && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Bạn cần quyền SUPER_ADMIN để chỉnh sửa scripts này
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Buttons */}
        <div className="flex justify-between items-center gap-4 pt-6 border-t">
          {/* ✅ RESTORE DEFAULTS: Button to restore default values */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowRestoreDialog(true)}
            disabled={saving || !isDirty}
          >
            Khôi phục mặc định
          </Button>
          
          <div className="flex gap-4 items-center">
            {/* Debug info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs text-muted-foreground">
                isDirty: {isDirty ? 'true' : 'false'} | saving: {saving ? 'true' : 'false'}
              </span>
            )}
            <Button 
              type="submit" 
              disabled={saving || !isDirty}
              onClick={(e) => {
                // ✅ DEBUG: Log form state when button is clicked (development only)
                // ✅ FIX: Only log simple values to avoid circular reference errors
                if (process.env.NODE_ENV === 'development') {
                  try {
                    const formValues = watch();
                    console.log('[Appearance Settings] Submit button clicked:', {
                      isDirty,
                      saving,
                      hasErrors: Object.keys(errors).length > 0,
                      errorCount: Object.keys(errors).length,
                      buttonDisabled: saving || !isDirty,
                      // Only log simple form values, not refs
                      hasLogo: !!formValues.header?.logo,
                      siteTitle: formValues.header?.siteTitle,
                      hasSocialLinks: (formValues.footer?.socialLinks?.length ?? 0) > 0,
                    });
                  } catch (e) {
                    console.log('[Appearance Settings] Submit button clicked:', { isDirty, saving, buttonDisabled: saving || !isDirty });
                  }
                }
                
                // Prevent default if disabled (shouldn't happen, but just in case)
                if (saving || !isDirty) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('[Appearance Settings] Button clicked but disabled:', { saving, isDirty });
                  }
                  e.preventDefault();
                  return;
                }
              }}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </form>
      
      {/* ✅ RESTORE DEFAULTS: Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khôi phục giá trị mặc định?</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn khôi phục tất cả cài đặt về giá trị mặc định? 
              Tất cả thay đổi chưa lưu sẽ bị mất.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestoreDefaults}
            >
              Khôi phục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

