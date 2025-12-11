'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import type { MappedCategory } from '@/lib/utils/productMapper';

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  position: number;
}

interface CategoryFormProps {
  categoryId?: string;
  initialData?: Partial<CategoryFormData>;
}

export function CategoryForm({ categoryId, initialData }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    imageUrl: '',
    position: 0,
    ...initialData,
  });

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/admin/categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!categoryId && formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, categoryId]);

  // Load category data if editing
  useEffect(() => {
    if (categoryId && !initialData) {
      async function fetchCategory() {
        try {
          const response = await fetch(`/api/admin/categories/${categoryId}`);
          const data = await response.json();
          if (data.category) {
            const category = data.category as MappedCategory;
            setFormData({
              name: category.name,
              slug: category.slug,
              description: '',
              parentId: null,
              imageUrl: '',
              position: 0,
            });
          }
        } catch (error) {
          console.error('Error fetching category:', error);
        }
      }
      fetchCategory();
    }
  }, [categoryId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || null,
      };

      const url = categoryId
        ? `/api/admin/categories/${categoryId}`
        : '/api/admin/categories';
      const method = categoryId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      router.push('/admin/categories');
      router.refresh();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Có lỗi xảy ra khi lưu danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Filter out current category from parent options
  const parentOptions = categories.filter(
    (cat) => cat.id !== categoryId
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin danh mục</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Tên danh mục *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="parentId">Danh mục cha</Label>
            <Select
              id="parentId"
              value={formData.parentId || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value || null }))}
            >
              <option value="">Không có (danh mục gốc)</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.databaseId}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="imageUrl">URL hình ảnh</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <Label htmlFor="position">Vị trí</Label>
            <Input
              id="position"
              type="number"
              min="0"
              value={formData.position}
              onChange={(e) => setFormData((prev) => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Số nhỏ hơn sẽ hiển thị trước
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Đang lưu...' : categoryId ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}

