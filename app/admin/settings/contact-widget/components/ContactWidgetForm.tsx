/**
 * Contact Widget Form Component
 * 
 * Main form for configuring Floating Contact Widget
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToastContext } from '@/components/providers/ToastProvider';
import { Loader2, Phone } from 'lucide-react';
import { ContactItemEditor } from './ContactItemEditor';
import type { ContactWidgetConfig } from '@/types/mongodb';

export function ContactWidgetForm() {
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  
  const [enabled, setEnabled] = useState(false);
  const [position, setPosition] = useState<'left' | 'right'>('right');
  const [primaryColor, setPrimaryColor] = useState('#D6336C');
  const [items, setItems] = useState<ContactWidgetConfig['items']>([
    { type: 'hotline', active: false, label: 'Gọi ngay', value: '' },
    { type: 'zalo', active: false, label: 'Chat Zalo', value: '' },
    { type: 'messenger', active: false, label: 'Chat Messenger', value: '' },
  ]);

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['contact-widget-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/contact-widget', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  // Load settings into form
  useEffect(() => {
    if (settingsData?.success && settingsData?.data) {
      const data = settingsData.data as ContactWidgetConfig;
      setEnabled(data.enabled || false);
      setPosition(data.position || 'right');
      setPrimaryColor(data.primaryColor || '#D6336C');
      
      // Merge with default items to preserve all 3 types
      const defaultItems: ContactWidgetConfig['items'] = [
        { type: 'hotline', active: false, label: 'Gọi ngay', value: '' },
        { type: 'zalo', active: false, label: 'Chat Zalo', value: '' },
        { type: 'messenger', active: false, label: 'Chat Messenger', value: '' },
      ];
      
      if (data.items && data.items.length > 0) {
        // Map existing items to default items
        const mergedItems = defaultItems.map(defaultItem => {
          const existing = data.items.find(item => item.type === defaultItem.type);
          return existing || defaultItem;
        });
        setItems(mergedItems);
      } else {
        setItems(defaultItems);
      }
    }
  }, [settingsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      enabled: boolean;
      position: 'left' | 'right';
      primaryColor: string;
      items: ContactWidgetConfig['items'];
    }) => {
      const res = await fetch('/api/admin/settings/contact-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save settings');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-widget-settings'] });
      showToast('Đã lưu cấu hình thành công', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Đã xảy ra lỗi khi lưu', 'error');
    },
  });

  // CRITICAL: Sử dụng useRef để lưu items và handler, tránh re-render loop
  const itemsRef = React.useRef(items);
  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // CRITICAL: Tạo stable callbacks sử dụng ref để tránh re-render loop
  // Callbacks luôn sử dụng items mới nhất từ ref
  const itemCallbacks = React.useMemo(() => {
    const callbacks: Record<string, (updates: Partial<ContactWidgetConfig['items'][0]>) => void> = {};
    items.forEach((item) => {
      callbacks[item.type] = (updates: Partial<ContactWidgetConfig['items'][0]>) => {
        // Luôn lấy items mới nhất từ ref để tìm index chính xác
        const currentIndex = itemsRef.current.findIndex((i) => i.type === item.type);
        if (currentIndex !== -1) {
          setItems((prev) => {
            const newItems = [...prev];
            newItems[currentIndex] = { ...newItems[currentIndex], ...updates };
            return newItems;
          });
        }
      };
    });
    return callbacks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]); // Chỉ phụ thuộc vào length để tạo lại khi thêm/xóa item, không theo dõi items để tránh infinite loop

  // Memoize handleEnabledChange để tránh re-render loop
  const handleEnabledChange = useCallback((checked: boolean) => {
    setEnabled(checked);
  }, []);

  const handleSave = () => {
    saveMutation.mutate({
      enabled,
      position,
      primaryColor,
      items,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt Nút Liên hệ Nổi</CardTitle>
          <CardDescription>Cấu hình nút liên hệ cố định trên website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt Nút Liên hệ Nổi</CardTitle>
        <CardDescription>
          Cấu hình nút liên hệ cố định (Hotline, Zalo, Messenger) hiển thị ở góc màn hình
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-base font-medium">
              Bật nút liên hệ nổi
            </Label>
            <p className="text-sm text-gray-500">
              Hiển thị nút liên hệ cố định ở góc màn hình
            </p>
          </div>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {/* Position Select */}
        <div className="space-y-2">
          <Label htmlFor="position">Vị trí hiển thị</Label>
          <Select value={position} onValueChange={(value) => setPosition(value as 'left' | 'right')}>
            <SelectTrigger id="position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Bên phải</SelectItem>
              <SelectItem value="left">Bên trái</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Màu chủ đạo</Label>
          <div className="flex items-center gap-4">
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#D6336C"
              className="flex-1 font-mono"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
          <p className="text-sm text-gray-500">
            Màu sắc chủ đạo cho nút liên hệ (hex code, ví dụ: #D6336C)
          </p>
        </div>

        {/* Contact Items */}
        <div className="space-y-4">
          <Label>Các kênh liên hệ</Label>
          {items.map((item, index) => (
            <ContactItemEditor
              key={item.type}
              item={item}
              onChange={itemCallbacks[item.type]}
            />
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="min-w-[120px]"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu Cài Đặt'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

