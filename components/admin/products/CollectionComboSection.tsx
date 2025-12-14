'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RelatedProductsSelector } from './RelatedProductsSelector';
import { ComboProductsBuilder } from './ComboProductsBuilder';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToastContext } from '@/components/providers/ToastProvider';

interface CollectionComboData {
  collections?: string[]; // Collection IDs/names
  comboProducts?: string[]; // Product IDs
  bundleProducts?: Array<{
    productId: string;
    quantity: number;
    discount?: number;
  }>;
  relatedProducts?: string[];
  upsellProducts?: string[];
  crossSellProducts?: string[];
}

interface CollectionComboSectionProps {
  data: CollectionComboData;
  onChange: (data: CollectionComboData) => void;
}

export function CollectionComboSection({ data, onChange }: CollectionComboSectionProps) {
  const { showToast } = useToastContext();
  const [collectionInput, setCollectionInput] = useState('');

  const updateField = (field: keyof CollectionComboData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addCollection = () => {
    if (!collectionInput.trim()) {
      showToast('Vui lòng nhập tên bộ sưu tập', 'error');
      return;
    }
    if (data.collections?.includes(collectionInput.trim())) {
      showToast('Bộ sưu tập đã tồn tại', 'info');
      return;
    }
    updateField('collections', [...(data.collections || []), collectionInput.trim()]);
    showToast(`Đã thêm bộ sưu tập "${collectionInput.trim()}"`, 'success');
    setCollectionInput('');
  };

  const removeCollection = (collection: string) => {
    updateField('collections', data.collections?.filter((c) => c !== collection) || []);
    showToast(`Đã xóa bộ sưu tập "${collection}"`, 'success');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bộ sưu tập & Sản phẩm liên quan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Collections */}
        <div>
          <Label className="mb-3 block">Bộ sưu tập</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={collectionInput}
              onChange={(e) => setCollectionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCollection())}
              placeholder="Nhập tên bộ sưu tập (ví dụ: Gấu bông lớn, Gấu bông nhỏ)"
            />
            <Button type="button" onClick={addCollection} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
          {data.collections && data.collections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.collections.map((collection) => (
                <span
                  key={collection}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {collection}
                  <button
                    type="button"
                    onClick={() => removeCollection(collection)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        <RelatedProductsSelector
          title="Sản phẩm liên quan"
          selectedProductIds={data.relatedProducts || []}
          onChange={(productIds) => updateField('relatedProducts', productIds)}
          placeholder="Tìm kiếm sản phẩm liên quan..."
        />

        {/* Upsell Products */}
        <RelatedProductsSelector
          title="Sản phẩm Upsell (Nâng cấp)"
          selectedProductIds={data.upsellProducts || []}
          onChange={(productIds) => updateField('upsellProducts', productIds)}
          placeholder="Tìm kiếm sản phẩm upsell..."
        />

        {/* Cross-sell Products */}
        <RelatedProductsSelector
          title="Sản phẩm Cross-sell (Thường mua cùng)"
          selectedProductIds={data.crossSellProducts || []}
          onChange={(productIds) => updateField('crossSellProducts', productIds)}
          placeholder="Tìm kiếm sản phẩm cross-sell..."
        />

        {/* Combo Products */}
        <div>
          <Label className="mb-3 block">Sản phẩm Combo (Sản phẩm đơn giản)</Label>
          <div className="border rounded-lg p-4 bg-gray-50">
            <RelatedProductsSelector
              title=""
              selectedProductIds={data.comboProducts || []}
              onChange={(productIds) => updateField('comboProducts', productIds)}
              placeholder="Tìm kiếm sản phẩm để thêm vào combo..."
            />
          </div>
        </div>

        {/* Bundle Products */}
        <div>
          <Label className="mb-3 block">Sản phẩm Bundle (Combo với số lượng và giảm giá)</Label>
          <div className="border rounded-lg p-4 bg-gray-50">
            <ComboProductsBuilder
              bundleProducts={data.bundleProducts || []}
              onChange={(bundleProducts) => updateField('bundleProducts', bundleProducts)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

