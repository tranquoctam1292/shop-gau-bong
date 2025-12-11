'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductDetailsData {
  ageRecommendation?: string;
  careInstructions?: string;
  safetyInformation?: string;
  productSpecifications?: string;
  sizeGuide?: string;
  materialDetails?: string;
  warrantyInformation?: string;
}

interface ProductDetailsSectionProps {
  data: ProductDetailsData;
  onChange: (data: ProductDetailsData) => void;
}

export function ProductDetailsSection({ data, onChange }: ProductDetailsSectionProps) {
  const updateField = (field: keyof ProductDetailsData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin chi tiết sản phẩm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ageRecommendation">Độ tuổi phù hợp</Label>
          <Input
            id="ageRecommendation"
            value={data.ageRecommendation || ''}
            onChange={(e) => updateField('ageRecommendation', e.target.value)}
            placeholder="Ví dụ: 3-12 tuổi"
          />
        </div>

        <div>
          <Label htmlFor="careInstructions">Hướng dẫn bảo quản</Label>
          <Textarea
            id="careInstructions"
            value={data.careInstructions || ''}
            onChange={(e) => updateField('careInstructions', e.target.value)}
            rows={4}
            placeholder="Hướng dẫn cách bảo quản sản phẩm..."
          />
        </div>

        <div>
          <Label htmlFor="safetyInformation">Thông tin an toàn</Label>
          <Textarea
            id="safetyInformation"
            value={data.safetyInformation || ''}
            onChange={(e) => updateField('safetyInformation', e.target.value)}
            rows={3}
            placeholder="Thông tin về độ an toàn của sản phẩm..."
          />
        </div>

        <div>
          <Label htmlFor="productSpecifications">Thông số kỹ thuật chi tiết</Label>
          <Textarea
            id="productSpecifications"
            value={data.productSpecifications || ''}
            onChange={(e) => updateField('productSpecifications', e.target.value)}
            rows={5}
            placeholder="Các thông số kỹ thuật chi tiết của sản phẩm..."
          />
        </div>

        <div>
          <Label htmlFor="sizeGuide">Hướng dẫn chọn size</Label>
          <Textarea
            id="sizeGuide"
            value={data.sizeGuide || ''}
            onChange={(e) => updateField('sizeGuide', e.target.value)}
            rows={4}
            placeholder="Hướng dẫn khách hàng chọn size phù hợp..."
          />
        </div>

        <div>
          <Label htmlFor="materialDetails">Chi tiết chất liệu</Label>
          <Textarea
            id="materialDetails"
            value={data.materialDetails || ''}
            onChange={(e) => updateField('materialDetails', e.target.value)}
            rows={3}
            placeholder="Chi tiết về chất liệu sản phẩm..."
          />
        </div>

        <div>
          <Label htmlFor="warrantyInformation">Thông tin bảo hành</Label>
          <Textarea
            id="warrantyInformation"
            value={data.warrantyInformation || ''}
            onChange={(e) => updateField('warrantyInformation', e.target.value)}
            rows={3}
            placeholder="Thông tin về chế độ bảo hành sản phẩm..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

