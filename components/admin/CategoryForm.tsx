'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RotateCcw, Image as ImageIcon, X } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';
import { SearchableCategorySelect } from './SearchableCategorySelect';
import { MediaPicker } from '@/components/admin/media/MediaPicker';
import type { MediaPickerValue } from '@/components/admin/media/MediaPicker';
import type { MappedCategory } from '@/lib/utils/productMapper';
import { useToastContext } from '@/components/providers/ToastProvider';

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  position: number;
  status: 'active' | 'inactive';
  metaTitle?: string;
  metaDesc?: string;
}

interface CategoryFormProps {
  categoryId?: string;
  initialData?: Partial<CategoryFormData>;
  onSuccess?: () => void;
}

export function CategoryForm({ categoryId, initialData, onSuccess }: CategoryFormProps) {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  const [slugError, setSlugError] = useState<string>('');
  const [circularRefWarning, setCircularRefWarning] = useState<string>('');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    imageUrl: '',
    position: 0,
    status: 'active',
    metaTitle: '',
    metaDesc: '',
    ...initialData,
  });

  // Fetch categories for parent selection
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/admin/categories?type=flat&status=all');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Auto-generate slug from name (only for new categories)
  useEffect(() => {
    if (!categoryId && formData.name && !formData.slug) {
      const slug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, categoryId]);

  // Load category data if editing
  useEffect(() => {
    if (categoryId && !initialData) {
      async function fetchCategory() {
        try {
          // Extract ID from GraphQL format if needed
          let id = categoryId!;
          if (categoryId!.startsWith('gid://shop-gau-bong/ProductCategory/')) {
            id = categoryId!.replace('gid://shop-gau-bong/ProductCategory/', '');
          }
          
          const response = await fetch(`/api/admin/categories/${id}`);
          const data = await response.json();
          if (data.category) {
            const category = data.category as MappedCategory;
            setFormData({
              name: category.name,
              slug: category.slug,
              description: '', // TODO: Add description field to API response
              parentId: category.parentId?.toString() || null,
              imageUrl: category.image?.sourceUrl || '',
              position: 0, // TODO: Add position field
              status: category.status || 'active',
              metaTitle: category.metaTitle || '',
              metaDesc: category.metaDesc || '',
            });
          }
        } catch (error) {
          console.error('Error fetching category:', error);
        }
      }
      fetchCategory();
    }
  }, [categoryId, initialData]);

  // Check slug uniqueness (debounced)
  useEffect(() => {
    if (!formData.slug) {
      setSlugError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/categories?search=${encodeURIComponent(formData.slug)}`);
        const data = await response.json();
        const existing = data.categories?.find(
          (cat: MappedCategory) =>
            cat.slug === formData.slug &&
            cat.id !== categoryId
        );
        
        if (existing) {
          setSlugError('Slug này đã tồn tại. Hệ thống sẽ tự động thêm số đuôi khi lưu.');
        } else {
          setSlugError('');
        }
      } catch (error) {
        // Ignore errors
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.slug, categoryId]);

  // Check circular reference when parent changes
  useEffect(() => {
    if (!categoryId || !formData.parentId) {
      setCircularRefWarning('');
      return;
    }

    // Simple check: if parentId is the same as categoryId
    if (formData.parentId === categoryId) {
      setCircularRefWarning('Không thể chọn chính danh mục này làm cha');
      return;
    }

    // Check if parent is a descendant (would need API call for full check)
    // For now, just clear warning
    setCircularRefWarning('');
  }, [formData.parentId, categoryId]);

  const handleRegenerateSlug = () => {
    if (formData.name) {
      const slug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug }));
      showToast('Đã tạo lại slug từ tên', 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSlugError('');
    setCircularRefWarning('');

    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || null,
      };

      // Extract ID from GraphQL format if needed
      let id = categoryId;
      if (categoryId && categoryId.startsWith('gid://shop-gau-bong/ProductCategory/')) {
        id = categoryId.replace('gid://shop-gau-bong/ProductCategory/', '');
      }
      
      const url = id
        ? `/api/admin/categories/${id}`
        : '/api/admin/categories';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi lưu danh mục', 'error');
        return;
      }

      showToast(
        categoryId ? 'Đã cập nhật danh mục thành công' : 'Đã tạo danh mục thành công',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/categories');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showToast('Có lỗi xảy ra khi lưu danh mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get excluded IDs (current category and its descendants)
  const getExcludedIds = (): string[] => {
    if (!categoryId) return [];
    
    // Extract ID from GraphQL format if needed
    let id = categoryId;
    if (categoryId.startsWith('gid://shop-gau-bong/ProductCategory/')) {
      id = categoryId.replace('gid://shop-gau-bong/ProductCategory/', '');
    }
    
    const excluded: string[] = [id, categoryId];
    // TODO: Fetch descendants from API if needed
    // For now, just exclude current category
    return excluded;
  };

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
            <div className="flex gap-2">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                required
                className={slugError ? 'border-yellow-500' : ''}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerateSlug}
                disabled={!formData.name}
                title="Tạo lại slug từ tên"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {slugError && (
              <p className="text-xs text-yellow-600 mt-1">{slugError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="parentId">Danh mục cha</Label>
            <SearchableCategorySelect
              value={formData.parentId || null}
              onChange={(value) => setFormData((prev) => ({ ...prev, parentId: value }))}
              categories={categories}
              excludeIds={getExcludedIds()}
              placeholder="Không có (danh mục gốc)"
            />
            {circularRefWarning && (
              <p className="text-xs text-red-600 mt-1">{circularRefWarning}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Mô tả ngắn về danh mục (hiển thị trên frontend)"
            />
          </div>

          <div>
            <Label>Hình ảnh đại diện</Label>
            <MediaPicker
              value={formData.imageUrl ? {
                _id: '',
                url: formData.imageUrl,
                name: 'Category Image',
                type: 'image',
                thumbnail_url: formData.imageUrl,
              } : undefined}
              onChange={(value) => {
                const mediaValue = Array.isArray(value) ? value[0] : value;
                setFormData((prev) => ({
                  ...prev,
                  imageUrl: mediaValue?.url || '',
                }));
              }}
              multiple={false}
              type="image"
            />
            {/* Fallback: URL input */}
            <div className="text-xs text-gray-500 mt-2">
              Hoặc nhập URL:
            </div>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Khuyến nghị: 500x500px, định dạng JPG/PNG/WEBP, tối đa 2MB
            </p>
          </div>

          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: 'active' }))}
                  className="w-4 h-4"
                />
                <span>Hoạt động</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: 'inactive' }))}
                  className="w-4 h-4"
                />
                <span>Không hoạt động</span>
              </label>
            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>SEO (Tối ưu hóa tìm kiếm)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={formData.metaTitle || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
              maxLength={255}
              placeholder="Tiêu đề hiển thị trên Google (nếu để trống sẽ dùng tên danh mục)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.metaTitle?.length || 0}/255 ký tự
            </p>
          </div>

          <div>
            <Label htmlFor="metaDesc">Meta Description</Label>
            <Textarea
              id="metaDesc"
              value={formData.metaDesc || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, metaDesc: e.target.value }))}
              maxLength={500}
              rows={3}
              placeholder="Mô tả hiển thị trên Google (nếu để trống sẽ dùng mô tả chính)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.metaDesc?.length || 0}/500 ký tự
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
        <Button type="submit" disabled={loading || !!slugError || !!circularRefWarning}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Đang lưu...' : categoryId ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>

    </form>
  );
}
