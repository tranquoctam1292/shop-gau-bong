'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';
import type { Attribute } from '@/app/admin/attributes/page';

interface AttributeFormProps {
  initialData?: Attribute | null;
  onSubmit: (data: Omit<Attribute, 'id'>) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export function AttributeForm({ initialData, onSubmit, onCancel }: AttributeFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'text' | 'color' | 'image' | 'button'>('text');
  const [sortOrder, setSortOrder] = useState<'name' | 'number' | 'id'>('name');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
      setType(initialData.type);
      setSortOrder(initialData.sortOrder);
      setAutoGenerateSlug(false);
    } else {
      // Reset form
      setName('');
      setSlug('');
      setType('text');
      setSortOrder('name');
      setAutoGenerateSlug(true);
    }
    setError(null);
  }, [initialData]);

  // Auto-generate slug from name
  useEffect(() => {
    if (autoGenerateSlug && name) {
      setSlug(generateSlug(name));
    }
  }, [name, autoGenerateSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tên thuộc tính không được để trống');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        name: name.trim(),
        slug: slug.trim() || generateSlug(name.trim()),
        type,
        sortOrder,
      });

      if (result.success) {
        // Reset form if creating new
        if (!initialData) {
          setName('');
          setSlug('');
          setType('text');
          setSortOrder('name');
          setAutoGenerateSlug(true);
        }
      } else {
        setError(result.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tên */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Tên <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setAutoGenerateSlug(true);
          }}
          placeholder="Ví dụ: Màu lông, Kích thước"
          required
        />
        <p className="text-sm text-muted-foreground">
          Tên thuộc tính sẽ hiển thị trong trang quản trị và có thể hiển thị trên frontend.
        </p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">Đường dẫn tĩnh (Slug)</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoGenerateSlug(false);
          }}
          placeholder="Tự động sinh từ tên"
        />
        <p className="text-sm text-muted-foreground">
          Đường dẫn URL. Thường là chữ thường, không dấu, cách nhau bởi dấu gạch ngang.
        </p>
      </div>

      {/* Loại hiển thị */}
      <div className="space-y-2">
        <Label htmlFor="type">Loại hiển thị <span className="text-red-500">*</span></Label>
        <Select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as Attribute['type'])}
          required
        >
          <option value="text">Văn bản (Select/Text)</option>
          <option value="color">Màu sắc (Color Swatch)</option>
          <option value="image">Hình ảnh (Image Swatch)</option>
          <option value="button">Nút bấm (Button/Label)</option>
        </Select>
        <p className="text-sm text-muted-foreground">
          {type === 'text' && 'Hiển thị dạng dropdown text (Mặc định)'}
          {type === 'color' && 'Hiển thị ô tròn màu trên frontend'}
          {type === 'image' && 'Hiển thị ảnh thumbnail nhỏ (Dùng cho loại vải/họa tiết)'}
          {type === 'button' && 'Hiển thị dạng ô chữ nhật bo góc (Dùng cho Kích thước)'}
        </p>
      </div>

      {/* Sắp xếp mặc định */}
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sắp xếp mặc định</Label>
        <Select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as Attribute['sortOrder'])}
        >
          <option value="name">Tên</option>
          <option value="number">Số</option>
          <option value="id">ID</option>
        </Select>
        <p className="text-sm text-muted-foreground">
          Cách sắp xếp các giá trị (terms) của thuộc tính này.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            initialData ? 'Cập nhật thuộc tính' : 'Thêm thuộc tính'
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}
