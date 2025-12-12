'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Ruler, Image as ImageIcon, Tag } from 'lucide-react';
import type { Attribute } from '@/app/admin/attributes/page';

interface AttributeCardSelectorProps {
  attributes: Attribute[];
  loading: boolean;
  onSelect: (attribute: Attribute) => void;
  selectedAttributeIds?: string[];
}

const typeIcons: Record<Attribute['type'], typeof Palette> = {
  text: Tag,
  color: Palette,
  image: ImageIcon,
  button: Ruler,
};

const typeLabels: Record<Attribute['type'], string> = {
  text: 'Văn bản',
  color: 'Màu sắc',
  image: 'Hình ảnh',
  button: 'Nút bấm',
};

export function AttributeCardSelector({
  attributes,
  loading,
  onSelect,
  selectedAttributeIds = [],
}: AttributeCardSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Chưa có thuộc tính global nào.</p>
        <p className="text-xs mt-1">
          Vào <strong>Sản phẩm &gt; Các thuộc tính</strong> để tạo thuộc tính mới.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {attributes.map((attribute) => {
        const Icon = typeIcons[attribute.type];
        const isSelected = selectedAttributeIds.includes(attribute.id);
        const isDisabled = isSelected;

        return (
          <Card
            key={attribute.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isDisabled && onSelect(attribute)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    attribute.type === 'color'
                      ? 'bg-pink-100 text-pink-700'
                      : attribute.type === 'image'
                      ? 'bg-blue-100 text-blue-700'
                      : attribute.type === 'button'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{attribute.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeLabels[attribute.type]}
                  </p>
                  {attribute.termsCount !== undefined && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {attribute.termsCount} giá trị
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="text-primary">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
