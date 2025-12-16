/**
 * Contact Item Editor Component
 * 
 * Component to edit individual contact item (Hotline, Zalo, Messenger)
 * Now includes SVG icon upload for Zalo/Messenger
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';
import type { ContactWidgetConfig } from '@/types/mongodb';

interface ContactItemEditorProps {
  item: ContactWidgetConfig['items'][0];
  onChange: (updates: Partial<ContactWidgetConfig['items'][0]>) => void;
}

const itemLabels: Record<ContactWidgetConfig['items'][0]['type'], string> = {
  hotline: 'Hotline',
  zalo: 'Zalo',
  messenger: 'Messenger',
};

const itemIcons: Record<ContactWidgetConfig['items'][0]['type'], typeof Phone> = {
  hotline: Phone,
  zalo: Phone,
  messenger: MessageCircle,
};

const itemPlaceholders: Record<ContactWidgetConfig['items'][0]['type'], string> = {
  hotline: '0123 456 789',
  zalo: '0123 456 789',
  messenger: 'your-page-id',
};

const itemDescriptions: Record<ContactWidgetConfig['items'][0]['type'], string> = {
  hotline: 'Số điện thoại (8-15 chữ số)',
  zalo: 'Số điện thoại Zalo (8-15 chữ số)',
  messenger: 'Page ID hoặc username Facebook (chỉ chữ, số, dấu chấm, gạch ngang)',
};

export function ContactItemEditor({ item, onChange }: ContactItemEditorProps) {
  const { showToast } = useToastContext();
  const [uploading, setUploading] = useState(false);
  const Icon = itemIcons[item.type];
  const label = itemLabels[item.type];
  const placeholder = itemPlaceholders[item.type];
  const description = itemDescriptions[item.type];
  const canUploadIcon = item.type === 'zalo' || item.type === 'messenger';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (SVG only)
    if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
      showToast('Chỉ chấp nhận file SVG (.svg)', 'error');
      return;
    }

    // Validate file size (max 500KB for SVG)
    if (file.size > 500 * 1024) {
      showToast('File SVG không được vượt quá 500KB', 'error');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      if (data.success && data.data?.url) {
        onChange({ iconUrl: data.data.url });
        showToast('Đã tải lên icon SVG thành công', 'success');
      } else {
        throw new Error('Invalid response');
      }
    } catch (error: any) {
      console.error('Error uploading SVG:', error);
      showToast(error.message || 'Lỗi khi tải lên icon SVG', 'error');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveIcon = () => {
    onChange({ iconUrl: undefined });
    showToast('Đã xóa icon tùy chỉnh', 'success');
  };

  return (
    <Card className={item.active ? 'border-primary' : 'border-gray-200'}>
      <CardContent className="p-4 space-y-4">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-600" />
            <Label className="text-base font-medium">{label}</Label>
          </div>
          <Switch
            checked={item.active}
            onCheckedChange={(checked) => onChange({ active: checked })}
          />
        </div>

        {/* Form Fields (only show if active) */}
        {item.active && (
          <div className="space-y-4 pt-2 border-t">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor={`${item.type}-label`}>Nhãn hiển thị</Label>
              <Input
                id={`${item.type}-label`}
                value={item.label}
                onChange={(e) => onChange({ label: e.target.value })}
                placeholder={`Ví dụ: ${label === 'Hotline' ? 'Gọi ngay' : label === 'Zalo' ? 'Chat Zalo' : 'Chat Messenger'}`}
              />
            </div>

            {/* Value */}
            <div className="space-y-2">
              <Label htmlFor={`${item.type}-value`}>
                {item.type === 'messenger' ? 'Page ID / Username' : 'Số điện thoại'}
              </Label>
              <Input
                id={`${item.type}-value`}
                value={item.value}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder={placeholder}
                type={item.type === 'messenger' ? 'text' : 'tel'}
              />
              <p className="text-sm text-gray-500">{description}</p>
            </div>

            {/* Custom Icon Upload (Zalo/Messenger only) */}
            {canUploadIcon && (
              <div className="space-y-2">
                <Label>Icon tùy chỉnh (SVG)</Label>
                <div className="space-y-2">
                  {item.iconUrl ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <div className="relative w-12 h-12 flex items-center justify-center border rounded bg-white">
                        <Image
                          src={item.iconUrl}
                          alt={`${label} icon`}
                          fill
                          className="object-contain"
                          sizes="48px"
                          onError={(e) => {
                            // Fallback nếu SVG không load được
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Icon đã tải lên
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.iconUrl}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveIcon}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Chưa có icon tùy chỉnh
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Tải lên file SVG để thay thế icon mặc định
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".svg,image/svg+xml"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          className="cursor-pointer"
                          onClick={() => {
                            // Trigger file input click
                            const input = document.querySelector(`input[type="file"][accept=".svg,image/svg+xml"]`) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          {uploading ? (
                            <>
                              <Upload className="h-4 w-4 mr-2 animate-pulse" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Tải lên SVG
                            </>
                          )}
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Tải lên file SVG tùy chỉnh cho {label}. Nếu không có, sẽ dùng icon mặc định.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
