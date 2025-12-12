'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface QuickEditCategoryProps {
  categoryId: string;
  name: string;
  slug: string;
  onSave: (name: string, slug: string) => Promise<void>;
  onCancel: () => void;
}

export function QuickEditCategory({
  categoryId,
  name: initialName,
  slug: initialSlug,
  onSave,
  onCancel,
}: QuickEditCategoryProps) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      alert('Tên và slug không được để trống');
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim(), slug.trim());
    } catch (error) {
      console.error('Error saving:', error);
      alert('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          ref={nameInputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tên danh mục"
          className="h-8"
        />
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Slug"
          className="h-8"
        />
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !name.trim() || !slug.trim()}
          className="h-8"
        >
          <Save className="w-3 h-3 mr-1" />
          {saving ? 'Đang lưu...' : 'Lưu'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="h-8"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Ctrl+Enter để lưu, Esc để hủy
      </p>
    </div>
  );
}

