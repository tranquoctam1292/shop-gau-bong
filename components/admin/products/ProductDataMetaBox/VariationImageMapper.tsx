'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { MediaLibraryModal, type MediaItem } from '../MediaLibraryModal';
import type { Variation } from './VariationTable';
import type { Attribute } from './AttributeItem';

interface VariationImageMapperProps {
  variations: Variation[];
  attributes: Attribute[];
  onMapImages: (mappings: Array<{ attributeName: string; attributeValue: string; imageId: string; imageUrl: string }>) => void;
}

export function VariationImageMapper({
  variations,
  attributes,
  onMapImages,
}: VariationImageMapperProps) {
  const [mappings, setMappings] = useState<
    Record<string, { imageId: string; imageUrl: string }>
  >({});
  const [showMediaLibrary, setShowMediaLibrary] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Get attribute values that can be mapped (only attributes used for variations)
  const mappableAttributes = useMemo(() => {
    return attributes.filter((attr) => attr.usedForVariations && attr.values.length > 0);
  }, [attributes]);

  // Group by attribute name - MUST be called before any early returns (React Hooks rules)
  const groupedByAttribute = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    mappableAttributes.forEach((attr) => {
      grouped[attr.name] = attr.values;
    });
    return grouped;
  }, [mappableAttributes]);

  // Calculate how many variations will be affected by each mapping
  const getAffectedCount = (attributeName: string, attributeValue: string): number => {
    return variations.filter(
      (variation) => variation.attributes[attributeName] === attributeValue
    ).length;
  };

  const handleImageSelect = (attributeName: string, attributeValue: string) => {
    return (item: MediaItem | MediaItem[]) => {
      const image = Array.isArray(item) ? item[0] : item;
      const key = `${attributeName}:${attributeValue}`;
      setMappings((prev) => ({
        ...prev,
        [key]: {
          imageId: image.id,
          imageUrl: image.url,
        },
      }));
      setShowMediaLibrary(null);
    };
  };

  const handleRemoveMapping = (key: string) => {
    setMappings((prev) => {
      const newMappings = { ...prev };
      delete newMappings[key];
      return newMappings;
    });
  };

  const handleApply = async () => {
    if (Object.keys(mappings).length === 0) {
      alert('Vui lòng chọn ít nhất một ảnh để gán');
      return;
    }

    setIsApplying(true);
    try {
      const mappingArray = Object.entries(mappings).map(([key, image]) => {
        const [attributeName, attributeValue] = key.split(':');
        return {
          attributeName,
          attributeValue,
          imageId: image.imageId,
          imageUrl: image.imageUrl,
        };
      });

      onMapImages(mappingArray);
      
      // Clear mappings after successful apply
      setMappings({});
    } finally {
      setIsApplying(false);
    }
  };

  if (mappableAttributes.length === 0) {
    return (
      <div className="p-4 border border-input rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          Chưa có thuộc tính nào được dùng cho biến thể. Vui lòng thêm thuộc tính trong tab &quot;Thuộc tính&quot;.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border border-input rounded-lg bg-muted/30 space-y-4">
        <div>
          <Label className="text-sm font-semibold">Gán ảnh thông minh theo Thuộc tính</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Gán ảnh cho tất cả biến thể có cùng giá trị thuộc tính. Ví dụ: Gán ảnh &quot;Gấu Nâu&quot; cho tất cả biến thể có màu Nâu (Nâu-1m, Nâu-1m5, Nâu-2m).
          </p>
        </div>

        {/* Mapping Table */}
        <div className="space-y-4">
          {Object.entries(groupedByAttribute).map(([attributeName, values]) => (
            <div key={attributeName} className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {attributeName}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {values.map((value) => {
                  const key = `${attributeName}:${value}`;
                  const mapping = mappings[key];
                  const affectedCount = getAffectedCount(attributeName, value);

                  return (
                    <Card
                      key={value}
                      className={`overflow-hidden ${
                        mapping ? 'border-primary' : ''
                      }`}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{value}</p>
                            <p className="text-xs text-muted-foreground">
                              {affectedCount} biến thể
                            </p>
                          </div>
                        </div>

                        {mapping ? (
                          <div className="space-y-2">
                            <div className="relative w-full h-20 border rounded overflow-hidden">
                              <Image
                                src={mapping.imageUrl}
                                alt={value}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 200px"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMapping(key)}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Xóa ảnh
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMediaLibrary(key)}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Chọn ảnh
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Apply Button */}
        {Object.keys(mappings).length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">
                  Đã chọn {Object.keys(mappings).length} ảnh
                </p>
                <p className="text-xs text-muted-foreground">
                  Sẽ gán ảnh cho{' '}
                  {Object.keys(mappings).reduce((total, key) => {
                    const [attrName, attrValue] = key.split(':');
                    return total + getAffectedCount(attrName, attrValue);
                  }, 0)}{' '}
                  biến thể
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="w-full"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang áp dụng...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Áp dụng ảnh cho biến thể
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibraryModal
          isOpen={!!showMediaLibrary}
          onClose={() => setShowMediaLibrary(null)}
          onSelect={(item) => {
            const [attributeName, attributeValue] = showMediaLibrary.split(':');
            handleImageSelect(attributeName, attributeValue)(item);
          }}
          mode="single"
        />
      )}
    </>
  );
}
