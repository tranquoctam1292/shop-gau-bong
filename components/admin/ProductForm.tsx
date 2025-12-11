'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X } from 'lucide-react';
import type { MappedProduct, MappedCategory } from '@/lib/utils/productMapper';
import { ProductDetailsSection } from './products/ProductDetailsSection';
import { VariantFormEnhanced, EnhancedVariant } from './products/VariantFormEnhanced';
import { SEOSection } from './products/SEOSection';
import { GiftFeaturesSection } from './products/GiftFeaturesSection';
import { MediaExtendedSection } from './products/MediaExtendedSection';
import { CollectionComboSection } from './products/CollectionComboSection';
import { TemplateSelector } from './products/TemplateSelector';

interface ProductVariant {
  id: string;
  size: string;
  color?: string;
  colorCode?: string;
  price: number;
  stock: number;
  image?: string;
  sku?: string;
}

interface ProductDetailsData {
  ageRecommendation?: string;
  careInstructions?: string;
  safetyInformation?: string;
  productSpecifications?: string;
  sizeGuide?: string;
  materialDetails?: string;
  warrantyInformation?: string;
}

interface SEOData {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
}

interface GiftFeaturesData {
  giftWrapping: boolean;
  giftWrappingPrice?: number;
  giftMessageEnabled: boolean;
  giftMessageMaxLength?: number;
  giftCardEnabled: boolean;
  giftCardTypes?: string[];
  giftDeliveryDateEnabled: boolean;
  giftCategories?: string[];
  giftSuggestions?: string[];
}

interface MediaExtendedData {
  videos?: Array<{
    url: string;
    type: 'youtube' | 'vimeo' | 'upload';
    thumbnail?: string;
  }>;
  view360Images?: string[];
  imageAltTexts?: Record<string, string>;
}

interface CollectionComboData {
  collections?: string[];
  comboProducts?: string[];
  bundleProducts?: Array<{
    productId: string;
    quantity: number;
    discount?: number;
  }>;
  relatedProducts?: string[];
  upsellProducts?: string[];
  crossSellProducts?: string[];
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  category: string;
  tags: string[];
  variants: EnhancedVariant[];
  images: string[];
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  material?: string;
  origin?: string;
  isHot: boolean;
  isActive: boolean;
  status: 'draft' | 'publish';
  // New fields for Phase 1
  productDetails?: ProductDetailsData;
  seo?: SEOData;
  // New fields for Phase 2
  giftFeatures?: GiftFeaturesData;
  mediaExtended?: MediaExtendedData;
  // New fields for Phase 3
  collectionCombo?: CollectionComboData;
}

interface ProductFormProps {
  productId?: string;
  initialData?: Partial<ProductFormData>;
}

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    sku: '',
    category: '',
    tags: [],
    variants: [],
    images: [],
    isHot: false,
    isActive: true,
    status: 'draft',
    productDetails: {},
    seo: {},
    giftFeatures: {
      giftWrapping: false,
      giftMessageEnabled: false,
      giftCardEnabled: false,
      giftDeliveryDateEnabled: false,
    },
    mediaExtended: {},
    collectionCombo: {},
    ...initialData,
  });
  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/admin/categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!productId && formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, productId]);

  // Load product data if editing
  useEffect(() => {
    if (productId && !initialData) {
      async function fetchProduct() {
        try {
          const response = await fetch(`/api/admin/products/${productId}`);
          const data = await response.json();
          if (data.product) {
            const product = data.product as MappedProduct;
            setFormData({
              name: product.name,
              slug: product.slug,
              description: product.description || '',
              shortDescription: product.shortDescription || '',
              sku: product.sku || '',
              category: product.categories[0]?.id?.toString() || '',
              tags: product.tags?.map((t) => t.name) || [],
              variants: product.attributes
                ?.find((a) => a.name === 'Size')
                ?.options.map((size, idx) => ({
                  id: `variant-${idx}`,
                  size,
                  price: parseFloat(product.price),
                  stock: product.stockQuantity || 0,
                })) || [],
              images: [
                product.image?.sourceUrl,
                ...product.galleryImages.map((img) => img.sourceUrl),
              ].filter(Boolean) as string[],
              length: product.length || undefined,
              width: product.width || undefined,
              height: product.height || undefined,
              weight: product.weight ? parseFloat(product.weight) : undefined,
              material: product.material || undefined,
              origin: product.origin || undefined,
              isHot: false,
              isActive: product.stockStatus === 'instock',
              status: 'publish',
            });
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
      fetchProduct();
    }
  }, [productId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate min/max price from variants
      const prices = formData.variants.length > 0
        ? formData.variants.map((v) => v.price)
        : [0];
      const minPrice = Math.min(...prices);
      const maxPrice = formData.variants.length > 1 ? Math.max(...prices) : undefined;

      const payload = {
        ...formData,
        minPrice,
        maxPrice,
        tags: formData.tags,
      };

      const url = productId
        ? `/api/admin/products/${productId}`
        : '/api/admin/products';
      const method = productId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Variant management functions removed - now handled by VariantFormEnhanced component

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()],
      }));
      setImageInput('');
    }
  };

  const removeImage = (image: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== image),
    }));
  };

  const handleLoadTemplate = (templateData: any) => {
    // Merge template data với form data hiện tại
    setFormData((prev) => ({
      ...prev,
      ...templateData,
      // Don't override ID fields if editing
      name: templateData.name || prev.name,
      slug: productId ? prev.slug : (templateData.slug || prev.slug), // Keep slug if editing
    }));
  };

  const handleSaveTemplate = async (name: string, description: string, category: string, templateData: any) => {
    try {
      const response = await fetch('/api/admin/products/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          templateData,
        }),
      });

      if (response.ok) {
        alert('Template đã được lưu thành công!');
      } else {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra khi lưu template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Có lỗi xảy ra khi lưu template');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Selector */}
      <TemplateSelector
        onLoadTemplate={handleLoadTemplate}
        onSaveTemplate={handleSaveTemplate}
        currentFormData={formData}
      />

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="shortDescription">Mô tả ngắn</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="category">Danh mục</Label>
            <Select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.databaseId}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Variants - Enhanced */}
      <VariantFormEnhanced
        variants={formData.variants}
        onChange={(variants) => setFormData((prev) => ({ ...prev, variants }))}
        baseSku={formData.sku}
      />

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="URL hình ảnh"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            />
            <Button type="button" onClick={addImage} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
          {formData.images.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={() => removeImage(img)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin bổ sung</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="length">Chiều dài (cm)</Label>
            <Input
              id="length"
              type="number"
              min="0"
              value={formData.length || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, length: parseFloat(e.target.value) || undefined }))}
            />
          </div>
          <div>
            <Label htmlFor="width">Chiều rộng (cm)</Label>
            <Input
              id="width"
              type="number"
              min="0"
              value={formData.width || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, width: parseFloat(e.target.value) || undefined }))}
            />
          </div>
          <div>
            <Label htmlFor="height">Chiều cao (cm)</Label>
            <Input
              id="height"
              type="number"
              min="0"
              value={formData.height || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, height: parseFloat(e.target.value) || undefined }))}
            />
          </div>
          <div>
            <Label htmlFor="weight">Trọng lượng (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              value={formData.weight || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
            />
          </div>
          <div>
            <Label htmlFor="material">Chất liệu</Label>
            <Input
              id="material"
              value={formData.material || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, material: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="origin">Xuất xứ</Label>
            <Input
              id="origin"
              value={formData.origin || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Thêm
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details Section */}
      <ProductDetailsSection
        data={formData.productDetails || {}}
        onChange={(productDetails) => setFormData((prev) => ({ ...prev, productDetails }))}
      />

      {/* SEO Section */}
      <SEOSection
        data={formData.seo || {}}
        onChange={(seo) => setFormData((prev) => ({ ...prev, seo }))}
        productName={formData.name}
        productSlug={formData.slug}
      />

      {/* Gift Features Section */}
      <GiftFeaturesSection
        data={formData.giftFeatures || {
          giftWrapping: false,
          giftMessageEnabled: false,
          giftCardEnabled: false,
          giftDeliveryDateEnabled: false,
        }}
        onChange={(giftFeatures) => setFormData((prev) => ({ ...prev, giftFeatures }))}
      />

      {/* Media Extended Section */}
      <MediaExtendedSection
        data={formData.mediaExtended || {}}
        onChange={(mediaExtended) => setFormData((prev) => ({ ...prev, mediaExtended }))}
        productImages={formData.images}
      />

      {/* Collection & Combo Section */}
      <CollectionComboSection
        data={formData.collectionCombo || {}}
        onChange={(collectionCombo) => setFormData((prev) => ({ ...prev, collectionCombo }))}
      />

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              <span>Kích hoạt</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isHot}
                onChange={(e) => setFormData((prev) => ({ ...prev, isHot: e.target.checked }))}
              />
              <span>Sản phẩm hot</span>
            </label>
          </div>
          <div>
            <Label htmlFor="status">Trạng thái xuất bản</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'draft' | 'publish' }))}
            >
              <option value="draft">Bản nháp</option>
              <option value="publish">Xuất bản</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Đang lưu...' : productId ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}

