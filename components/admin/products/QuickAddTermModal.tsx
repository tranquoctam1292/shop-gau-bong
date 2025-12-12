'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';
import type { Attribute } from '@/app/admin/attributes/page';
import { MediaLibraryModal, type MediaItem } from '@/components/admin/products/MediaLibraryModal';

interface QuickAddTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  attribute: Attribute;
  onSuccess: (termName: string) => void;
}

/**
 * Color Picker Component
 */
function ColorPicker({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-12 cursor-pointer"
        />
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => {
            const hex = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex) || hex === '#') {
              onChange(hex);
            }
          }}
          placeholder="#000000"
          pattern="^#[0-9A-Fa-f]{6}$"
          className="flex-1 font-mono"
        />
        {value && (
          <div
            className="w-12 h-12 rounded-lg border-2 border-gray-300"
            style={{ backgroundColor: value }}
            title={value}
          />
        )}
      </div>
    </div>
  );
}

export function QuickAddTermModal({
  isOpen,
  onClose,
  attribute,
  onSuccess,
}: QuickAddTermModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState('');
  const [colorHex2, setColorHex2] = useState('');
  const [hasGradient, setHasGradient] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageId, setImageId] = useState('');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSlug('');
      setDescription('');
      setColorHex('');
      setColorHex2('');
      setHasGradient(false);
      setImageUrl('');
      setImageId('');
      setAutoGenerateSlug(true);
      setError(null);
    }
  }, [isOpen]);

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
      setError('Tên giá trị không được để trống');
      return;
    }

    // Validate color type
    if (attribute.type === 'color' && !colorHex) {
      setError('Vui lòng chọn màu');
      return;
    }

    // Validate image/button type
    if (
      (attribute.type === 'image' || attribute.type === 'button') &&
      !imageUrl &&
      !imageId
    ) {
      setError('Vui lòng upload ảnh');
      return;
    }

    setIsSubmitting(true);

    try {
      const termData: any = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name.trim()),
        description: description.trim() || undefined,
      };

      // Add type-specific fields
      if (attribute.type === 'color') {
        termData.colorHex = colorHex;
        if (hasGradient && colorHex2) {
          termData.colorHex2 = colorHex2;
        }
      } else if (attribute.type === 'image' || attribute.type === 'button') {
        if (imageId) {
          termData.imageId = imageId;
        }
        if (imageUrl) {
          termData.imageUrl = imageUrl;
        }
      }

      const response = await fetch(`/api/admin/attributes/${attribute.id}/terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.term.name);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Có lỗi xảy ra khi tạo giá trị');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (item: MediaItem | MediaItem[]) => {
    const image = Array.isArray(item) ? item[0] : item;
    setImageId(image.id);
    setImageUrl(image.url);
    setShowMediaLibrary(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo giá trị mới cho "{attribute.name}"</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Tên */}
            <div className="space-y-2">
              <Label htmlFor="quick-name">
                Tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quick-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAutoGenerateSlug(true);
                }}
                placeholder="Nhập tên giá trị"
                required
                autoFocus
              />
            </div>

            {/* Slug (only for text and color types) */}
            {(attribute.type === 'text' || attribute.type === 'color') && (
              <div className="space-y-2">
                <Label htmlFor="quick-slug">Slug</Label>
                <Input
                  id="quick-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutoGenerateSlug(false);
                  }}
                  placeholder="Tự động sinh từ tên"
                />
              </div>
            )}

            {/* Mô tả */}
            {(attribute.type === 'button' ||
              attribute.type === 'text' ||
              attribute.type === 'color') && (
              <div className="space-y-2">
                <Label htmlFor="quick-description">Mô tả</Label>
                <Textarea
                  id="quick-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {/* Color Picker (for color type) */}
            {attribute.type === 'color' && (
              <>
                <ColorPicker
                  label="Mã màu"
                  value={colorHex}
                  onChange={setColorHex}
                  required
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="quick-gradient"
                      checked={hasGradient}
                      onChange={(e) => {
                        setHasGradient(e.target.checked);
                        if (!e.target.checked) {
                          setColorHex2('');
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="quick-gradient" className="cursor-pointer text-sm">
                      Phối màu (Gradient)
                    </Label>
                  </div>
                  {hasGradient && (
                    <ColorPicker
                      label="Mã màu thứ 2"
                      value={colorHex2}
                      onChange={setColorHex2}
                    />
                  )}
                </div>
              </>
            )}

            {/* Image Upload (for image and button types) */}
            {(attribute.type === 'image' || attribute.type === 'button') && (
              <div className="space-y-2">
                <Label>
                  {attribute.type === 'button'
                    ? 'Ảnh minh họa'
                    : 'Upload Ảnh Swatch'}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  {imageUrl && (
                    <div className="relative w-full h-24 border rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={name || 'Preview'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMediaLibrary(true)}
                    className="w-full"
                  >
                    {imageUrl ? 'Thay đổi ảnh' : 'Chọn ảnh từ thư viện'}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo giá trị'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleImageSelect}
          mode="single"
        />
      )}
    </>
  );
}
