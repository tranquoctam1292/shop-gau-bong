'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface Menu {
  id: string;
  name: string;
  location: string | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface MenuEditorHeaderProps {
  menu: Menu;
  onUpdate: (updates: Partial<Menu>) => Promise<void>;
}

const LOCATION_OPTIONS = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'mobile-sidebar', label: 'Mobile Sidebar' },
  { value: 'footer-column-1', label: 'Footer Column 1' },
  { value: 'footer-column-2', label: 'Footer Column 2' },
  { value: 'footer-column-3', label: 'Footer Column 3' },
];

export function MenuEditorHeader({ menu, onUpdate }: MenuEditorHeaderProps) {
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: menu.name,
    location: menu.location || 'none',
    status: menu.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên menu', 'error');
      return;
    }

    setLoading(true);
    try {
      await onUpdate({
        name: formData.name,
        location: formData.location === 'none' ? null : formData.location,
        status: formData.status,
      });
    } catch (err) {
      // Error already handled in parent
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    formData.name !== menu.name ||
    (formData.location === 'none' ? null : formData.location) !== menu.location ||
    formData.status !== menu.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin menu</CardTitle>
        <CardDescription>
          Cập nhật thông tin cơ bản của menu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Menu Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên menu *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Vị trí hiển thị</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vị trí (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không gán vị trí</SelectItem>
                {LOCATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Mỗi vị trí chỉ có thể có 1 menu hoạt động. Menu cũ sẽ tự động bị tạm dừng.
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          {hasChanges && (
            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

