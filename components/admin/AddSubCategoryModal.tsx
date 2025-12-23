'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';
import { useToastContext } from '@/components/providers/ToastProvider';

interface AddSubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  parentName: string;
  onSuccess: () => void;
}

export function AddSubCategoryModal({
  isOpen,
  onClose,
  parentId,
  parentName,
  onSuccess,
}: AddSubCategoryModalProps) {
  const { showToast } = useToastContext();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !slug.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          parentId: parentId,
          status: 'active',
          position: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi tạo danh mục', 'error');
        return;
      }

      showToast('Đã tạo danh mục con thành công', 'success');

      // Reset form
      setName('');
      setSlug('');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating category:', error);
      showToast('Có lỗi xảy ra khi tạo danh mục', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSlug('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm danh mục con</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Thêm danh mục con cho: <strong>{parentName}</strong>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="subcategory-name">Tên danh mục *</Label>
            <Input
              id="subcategory-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="subcategory-slug">Slug *</Label>
            <Input
              id="subcategory-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Đang tạo...' : 'Tạo danh mục'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

