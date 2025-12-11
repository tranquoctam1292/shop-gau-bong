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
import { ProductFormLayout } from './products/ProductFormLayout';
import { PublishBox } from './products/sidebar/PublishBox';
import { CategoriesBox } from './products/sidebar/CategoriesBox';
import { TagsBox } from './products/sidebar/TagsBox';
import { FeaturedImageBox } from './products/sidebar/FeaturedImageBox';
import { ProductGalleryBox } from './products/sidebar/ProductGalleryBox';
import { ProductDataBox } from './products/sidebar/ProductDataBox';
import { ProductLinksBox } from './products/sidebar/ProductLinksBox';
import { ClassicEditor } from './products/ClassicEditor';

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
  category: string; // Keep for backward compatibility
  categories?: string[]; // Multiple categories support
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
    categories: [],
    tags: [],
    variants: [],
    images: [],
    isHot: false,
    isActive: true,
    status: 'draft',
    visibility: 'public',
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
              categories: product.categories?.map((c) => c.id?.toString()).filter(Boolean) || [],
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

  // Prepare payload helper
  const preparePayload = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return null;
    }

    // Auto-generate slug if empty
    let slug = formData.slug.trim();
    if (!slug) {
      slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Calculate min/max price from variants
    let minPrice = 0;
    let maxPrice: number | undefined = undefined;
    
    if (formData.variants.length > 0) {
      const prices = formData.variants
        .map((v) => v.price)
        .filter((p) => !isNaN(p) && p >= 0);
      
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
        if (prices.length > 1) {
          maxPrice = Math.max(...prices);
        }
      }
    }

    // Validate minPrice
    if (minPrice < 0 || isNaN(minPrice)) {
      alert('Giá sản phẩm không hợp lệ');
      return null;
    }

    // Map categories to categoryIds if needed
    // Support both single category (backward compatibility) and multiple categories
    let categoryIds: string[] = [];
    
    if (formData.categories && formData.categories.length > 0) {
      // Use multiple categories if available
      categoryIds = formData.categories
        .map((catId) => {
          const category = categories.find((c) => c.id === catId || c.databaseId?.toString() === catId);
          return category?.id || catId;
        })
        .filter(Boolean);
    } else if (formData.category) {
      // Fallback to single category
      const selectedCategory = categories.find((c) => c.id === formData.category || c.name === formData.category);
      if (selectedCategory) {
        categoryIds = [selectedCategory.id];
      }
    }

    return {
      ...formData,
      slug,
      minPrice,
      maxPrice,
      category: categoryIds[0] || formData.category || undefined, // Keep for backward compatibility
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      tags: formData.tags.filter((t) => t.trim().length > 0),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave('publish');
  };

  const handleSave = async (saveStatus: 'draft' | 'publish' = 'draft') => {
    setLoading(true);

    try {
      const payload = preparePayload();
      if (!payload) {
        setLoading(false);
        return;
      }

      // Override status based on save action
      const finalPayload = {
        ...payload,
        status: saveStatus,
      };

      const url = productId
        ? `/api/admin/products/${productId}`
        : '/api/admin/products';
      const method = productId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      const result = await response.json();
      
      // If creating new product, update productId for preview
      if (!productId && result.product?._id) {
        // Update URL with new product ID
        router.push(`/admin/products/${result.product._id}/edit`);
        router.refresh();
      } else {
        // Just refresh if editing
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    await handleSave('publish');
  };

  const handleSaveDraft = async () => {
    await handleSave('draft');
  };

  // Variant management functions removed - now handled by VariantFormEnhanced component
  // Tag management functions removed - now handled by TagsBox component
  // Image management functions removed - now handled by FeaturedImageBox and ProductGalleryBox

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

  // Fetch popular tags (from existing products)
  const fetchPopularTags = async (): Promise<string[]> => {
    try {
      // Fetch tags from API or use existing tags from products
      // For now, return empty array - can be enhanced later
      return [];
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      return [];
    }
  };

  // Sidebar content
  const sidebarContent = (
    <>
      {/* Publish Box */}
      <PublishBox
        status={formData.status}
        isActive={formData.isActive}
        visibility={formData.visibility}
        onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
        onIsActiveChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
        onVisibilityChange={(visibility) => setFormData((prev) => ({ ...prev, visibility }))}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
        loading={loading}
        productId={productId}
        productSlug={formData.slug}
      />

      {/* Categories Box */}
      <CategoriesBox
        categories={categories}
        selectedCategories={formData.categories || (formData.category ? [formData.category] : [])}
        onCategoriesChange={(categoryIds) => {
          setFormData((prev) => ({
            ...prev,
            categories: categoryIds,
            category: categoryIds[0] || '', // Keep for backward compatibility
          }));
        }}
      />

      {/* Tags Box */}
      <TagsBox
        tags={formData.tags}
        onTagsChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
        onFetchPopularTags={fetchPopularTags}
      />

      {/* Featured Image Box */}
      <FeaturedImageBox
        featuredImage={formData.images[0]}
        onImageChange={(imageUrl) => {
          setFormData((prev) => ({
            ...prev,
            images: prev.images.length > 0
              ? [imageUrl, ...prev.images.slice(1)]
              : [imageUrl],
          }));
        }}
        onImageRemove={() => {
          setFormData((prev) => ({
            ...prev,
            images: prev.images.slice(1),
          }));
        }}
      />

      {/* Product Gallery Box */}
      <ProductGalleryBox
        images={formData.images}
        featuredImageIndex={0}
        onImagesChange={(images) => {
          setFormData((prev) => ({ ...prev, images }));
        }}
        onSetFeatured={(index) => {
          const newImages = [...formData.images];
          const [featuredImage] = newImages.splice(index, 1);
          newImages.unshift(featuredImage);
          setFormData((prev) => ({ ...prev, images: newImages }));
        }}
      />

      {/* Product Data Box */}
      <ProductDataBox
        sku={formData.sku}
        onSkuChange={(sku) => setFormData((prev) => ({ ...prev, sku }))}
        length={formData.length}
        width={formData.width}
        height={formData.height}
        weight={formData.weight}
        onLengthChange={(length) => setFormData((prev) => ({ ...prev, length }))}
        onWidthChange={(width) => setFormData((prev) => ({ ...prev, width }))}
        onHeightChange={(height) => setFormData((prev) => ({ ...prev, height }))}
        onWeightChange={(weight) => setFormData((prev) => ({ ...prev, weight }))}
      />

      {/* Product Links Box */}
      <ProductLinksBox
        slug={formData.slug}
        productId={productId}
        status={formData.status}
        onSlugChange={(slug) => setFormData((prev) => ({ ...prev, slug }))}
      />
    </>
  );

  // Header content
  const headerContent = (
    <div>
      <Input
        type="text"
        placeholder="Nhập tên sản phẩm..."
        value={formData.name}
        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        className="text-2xl font-bold border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <ProductFormLayout header={headerContent} sidebar={sidebarContent}>
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
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="shortDescription">Mô tả ngắn</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
              rows={3}
              className="mt-2"
              placeholder="Mô tả ngắn gọn về sản phẩm (hiển thị trong danh sách sản phẩm)"
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <div className="mt-2">
              <ClassicEditor
                value={formData.description}
                onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                placeholder="Mô tả đầy đủ về sản phẩm (hiển thị trong trang chi tiết)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants - Enhanced */}
      <VariantFormEnhanced
        variants={formData.variants}
        onChange={(variants) => setFormData((prev) => ({ ...prev, variants }))}
        baseSku={formData.sku}
      />

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin bổ sung</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="material">Chất liệu</Label>
            <Input
              id="material"
              value={formData.material || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, material: e.target.value }))}
              className="mt-2"
              placeholder="VD: Cotton, Polyester..."
            />
          </div>
          <div>
            <Label htmlFor="origin">Xuất xứ</Label>
            <Input
              id="origin"
              value={formData.origin || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value }))}
              className="mt-2"
              placeholder="VD: Việt Nam, Trung Quốc..."
            />
          </div>
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

      {/* Product Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Thiết lập sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isHot}
                onChange={(e) => setFormData((prev) => ({ ...prev, isHot: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Sản phẩm nổi bật</span>
            </label>
            <p className="text-xs text-muted-foreground">
              (Hiển thị sản phẩm này ở vị trí nổi bật trên trang chủ)
            </p>
          </div>
        </CardContent>
      </Card>
      </ProductFormLayout>
    </form>
  );
}

