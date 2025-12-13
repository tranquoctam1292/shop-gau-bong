'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

const LOCATION_OPTIONS = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'mobile-sidebar', label: 'Mobile Sidebar' },
  { value: 'footer-column-1', label: 'Footer Column 1' },
  { value: 'footer-column-2', label: 'Footer Column 2' },
  { value: 'footer-column-3', label: 'Footer Column 3' },
];

export default function NewMenuPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: 'none',
    status: 'active' as 'active' | 'inactive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên menu', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location === 'none' ? null : formData.location,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create menu');
      }

      const data = await response.json();
      showToast('Tạo menu thành công', 'success');
      router.push(`/admin/menus/${data.menu.id}`);
    } catch (err: any) {
      console.error('Error creating menu:', err);
      showToast(err.message || 'Không thể tạo menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/menus">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo menu mới</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo menu mới để quản lý điều hướng trên website
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin menu</CardTitle>
          <CardDescription>
            Điền thông tin cơ bản cho menu mới
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Menu Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên menu *</Label>
              <Input
                id="name"
                placeholder="Ví dụ: Menu chính, Footer menu..."
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
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/admin/menus">
                <Button type="button" variant="outline" disabled={loading}>
                  Hủy
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Tạo menu
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

