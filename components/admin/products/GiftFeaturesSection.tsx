'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface GiftFeaturesData {
  giftWrapping: boolean;
  giftWrappingPrice?: number;
  giftMessageEnabled: boolean;
  giftMessageMaxLength?: number;
  giftCardEnabled: boolean;
  giftCardTypes?: string[]; // e.g., ['birthday', 'anniversary', 'graduation']
  giftDeliveryDateEnabled: boolean;
  giftCategories?: string[]; // Gift categories for this product
  giftSuggestions?: string[]; // Suggested gift messages
}

interface GiftFeaturesSectionProps {
  data: GiftFeaturesData;
  onChange: (data: GiftFeaturesData) => void;
}

export function GiftFeaturesSection({ data, onChange }: GiftFeaturesSectionProps) {
  const [giftCategoryInput, setGiftCategoryInput] = useState('');
  const [giftSuggestionInput, setGiftSuggestionInput] = useState('');

  const updateField = (field: keyof GiftFeaturesData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addGiftCategory = () => {
    if (giftCategoryInput.trim() && !data.giftCategories?.includes(giftCategoryInput.trim())) {
      updateField('giftCategories', [...(data.giftCategories || []), giftCategoryInput.trim()]);
      setGiftCategoryInput('');
    }
  };

  const removeGiftCategory = (category: string) => {
    updateField('giftCategories', data.giftCategories?.filter((c) => c !== category) || []);
  };

  const addGiftSuggestion = () => {
    if (giftSuggestionInput.trim() && !data.giftSuggestions?.includes(giftSuggestionInput.trim())) {
      updateField('giftSuggestions', [...(data.giftSuggestions || []), giftSuggestionInput.trim()]);
      setGiftSuggestionInput('');
    }
  };

  const removeGiftSuggestion = (suggestion: string) => {
    updateField('giftSuggestions', data.giftSuggestions?.filter((s) => s !== suggestion) || []);
  };

  const giftCardTypeOptions = [
    'birthday',
    'anniversary',
    'graduation',
    'wedding',
    'newborn',
    'valentine',
    'christmas',
    'thank-you',
    'congratulations',
    'get-well',
  ];

  const toggleGiftCardType = (type: string) => {
    const currentTypes = data.giftCardTypes || [];
    if (currentTypes.includes(type)) {
      updateField('giftCardTypes', currentTypes.filter((t) => t !== type));
    } else {
      updateField('giftCardTypes', [...currentTypes, type]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tính năng quà tặng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gift Wrapping */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="giftWrapping"
              checked={data.giftWrapping || false}
              onChange={(e) => updateField('giftWrapping', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="giftWrapping" className="font-medium">
              Cho phép gói quà
            </Label>
          </div>
          {data.giftWrapping && (
            <div>
              <Label htmlFor="giftWrappingPrice">Giá gói quà (VNĐ)</Label>
              <Input
                id="giftWrappingPrice"
                type="number"
                min="0"
                value={data.giftWrappingPrice || ''}
                onChange={(e) => updateField('giftWrappingPrice', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          )}
        </div>

        {/* Gift Message */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="giftMessageEnabled"
              checked={data.giftMessageEnabled || false}
              onChange={(e) => updateField('giftMessageEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="giftMessageEnabled" className="font-medium">
              Cho phép tin nhắn quà tặng
            </Label>
          </div>
          {data.giftMessageEnabled && (
            <div>
              <Label htmlFor="giftMessageMaxLength">Độ dài tối đa tin nhắn (ký tự)</Label>
              <Input
                id="giftMessageMaxLength"
                type="number"
                min="0"
                max="500"
                value={data.giftMessageMaxLength || ''}
                onChange={(e) => updateField('giftMessageMaxLength', parseInt(e.target.value) || 200)}
                placeholder="200"
              />
            </div>
          )}
        </div>

        {/* Gift Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="giftCardEnabled"
              checked={data.giftCardEnabled || false}
              onChange={(e) => updateField('giftCardEnabled', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="giftCardEnabled" className="font-medium">
              Hỗ trợ thẻ quà tặng
            </Label>
          </div>
          {data.giftCardEnabled && (
            <div>
              <Label className="mb-2 block">Loại thẻ quà tặng</Label>
              <div className="flex flex-wrap gap-2">
                {giftCardTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleGiftCardType(type)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      data.giftCardTypes?.includes(type)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gift Delivery Date */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="giftDeliveryDateEnabled"
            checked={data.giftDeliveryDateEnabled || false}
            onChange={(e) => updateField('giftDeliveryDateEnabled', e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="giftDeliveryDateEnabled" className="font-medium">
            Cho phép chọn ngày giao quà
          </Label>
        </div>

        {/* Gift Categories */}
        <div>
          <Label>Danh mục quà tặng</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={giftCategoryInput}
              onChange={(e) => setGiftCategoryInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGiftCategory())}
              placeholder="Nhập danh mục quà tặng (ví dụ: Sinh nhật, Kỷ niệm)"
            />
            <Button type="button" onClick={addGiftCategory} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
          {data.giftCategories && data.giftCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.giftCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => removeGiftCategory(category)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gift Suggestions */}
        <div>
          <Label>Gợi ý tin nhắn quà tặng</Label>
          <div className="flex gap-2 mb-2">
            <Textarea
              value={giftSuggestionInput}
              onChange={(e) => setGiftSuggestionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGiftSuggestion())}
              placeholder="Nhập gợi ý tin nhắn quà tặng"
              rows={2}
            />
            <Button type="button" onClick={addGiftSuggestion} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
          {data.giftSuggestions && data.giftSuggestions.length > 0 && (
            <div className="space-y-2">
              {data.giftSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-2 bg-gray-50 rounded border"
                >
                  <p className="text-sm flex-1">{suggestion}</p>
                  <button
                    type="button"
                    onClick={() => removeGiftSuggestion(suggestion)}
                    className="hover:text-red-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

