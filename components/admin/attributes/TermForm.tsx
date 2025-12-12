'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';
import type { Term } from '@/app/admin/attributes/[id]/terms/page';
import type { Attribute } from '@/app/admin/attributes/page';
import { MediaLibraryModal, type MediaItem } from '@/components/admin/products/MediaLibraryModal';

interface TermFormProps {
  attributeType: Attribute['type'];
  initialData?: Term | null;
  onSubmit: (data: Omit<Term, 'id' | 'attributeId'>) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
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
      <p className="text-sm text-muted-foreground">
        Chọn màu hoặc nhập mã hex (ví dụ: #FF0000)
      </p>
    </div>
  );
}

export function TermForm({ attributeType, initialData, onSubmit, onCancel }: TermFormProps) {
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

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
      setDescription(initialData.description || '');
      setColorHex(initialData.colorHex || '');
      setColorHex2(initialData.colorHex2 || '');
      setHasGradient(!!initialData.colorHex2);
      setImageUrl(initialData.imageUrl || '');
      setImageId(initialData.imageId || '');
      setAutoGenerateSlug(false);
    } else {
      // Reset form
      setName('');
      setSlug('');
      setDescription('');
      setColorHex('');
      setColorHex2('');
      setHasGradient(false);
      setImageUrl('');
      setImageId('');
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
      setError('Tên giá trị không được để trống');
      return;
    }

    // Validate color type
    if (attributeType === 'color' && !colorHex) {
      setError('Vui lòng chọn màu');
      return;
    }

    // Validate image/button type
    if ((attributeType === 'image' || attributeType === 'button') && !imageUrl && !imageId) {
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
      if (attributeType === 'color') {
        termData.colorHex = colorHex;
        if (hasGradient && colorHex2) {
          termData.colorHex2 = colorHex2;
        }
      } else if (attributeType === 'image' || attributeType === 'button') {
        if (imageId) {
          termData.imageId = imageId;
        }
        if (imageUrl) {
          termData.imageUrl = imageUrl;
        }
      }

      const result = await onSubmit(termData);

      if (result.success) {
        // Reset form if creating new
        if (!initialData) {
          setName('');
          setSlug('');
          setDescription('');
          setColorHex('');
          setColorHex2('');
          setHasGradient(false);
          setImageUrl('');
          setImageId('');
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

  const handleImageSelect = (item: MediaItem | MediaItem[]) => {
    // Handle both single and array (for type safety)
    const image = Array.isArray(item) ? item[0] : item;
    setImageId(image.id);
    setImageUrl(image.url);
    setShowMediaLibrary(false);
  };

  return (
    <>
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
            placeholder={
              attributeType === 'color' ? 'Ví dụ: Nâu Chocolate' :
              attributeType === 'button' ? 'Ví dụ: 1m2' :
              attributeType === 'image' ? 'Ví dụ: Vải Nhung Tăm' :
              'Ví dụ: Giá trị 1'
            }
            required
          />
        </div>

        {/* Slug (only for text and color types) */}
        {(attributeType === 'text' || attributeType === 'color') && (
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
          </div>
        )}

        {/* Mô tả */}
        {(attributeType === 'button' || attributeType === 'text' || attributeType === 'color') && (
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                attributeType === 'button' ? 'Ví dụ: Kích thước tính theo khổ vải chưa nhồi bông' :
                'Mô tả về giá trị này'
              }
              rows={3}
            />
          </div>
        )}

        {/* Color Picker (for color type) */}
        {attributeType === 'color' && (
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
                  id="hasGradient"
                  checked={hasGradient}
                  onChange={(e) => {
                    setHasGradient(e.target.checked);
                    if (!e.target.checked) {
                      setColorHex2('');
                    }
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="hasGradient" className="cursor-pointer">
                  Phối màu (Gradient) - Cho gấu phối màu
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
            {/* Preview */}
            {colorHex && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full border-2 border-gray-300"
                    style={{
                      background: hasGradient && colorHex2
                        ? `linear-gradient(135deg, ${colorHex} 0%, ${colorHex2} 100%)`
                        : colorHex,
                    }}
                    title={name || 'Preview'}
                  />
                  <div className="text-sm text-muted-foreground">
                    {hasGradient && colorHex2 ? 'Gradient' : 'Solid'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Image Upload (for image and button types) */}
        {(attributeType === 'image' || attributeType === 'button') && (
          <div className="space-y-2">
            <Label>
              {attributeType === 'button' ? 'Ảnh minh họa (Size Guide Image)' : 'Upload Ảnh Swatch'}
              <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3">
              {imageUrl && (
                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
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
                onClick={() => setShowMediaLibrary(true)}
              >
                {imageUrl ? 'Thay đổi ảnh' : 'Chọn ảnh từ thư viện'}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageUrl('');
                    setImageId('');
                  }}
                  className="text-red-600"
                >
                  Xóa ảnh
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {attributeType === 'button'
                ? 'Upload ảnh vector so sánh gấu với người thật. Ảnh này sẽ hiện lên tooltip khi khách chọn size.'
                : 'Upload ảnh swatch (chi tiết bề mặt vải) để hiển thị trên frontend.'}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              initialData ? 'Cập nhật giá trị' : 'Thêm giá trị'
            )}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
        </div>
      </form>

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
