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
import { SEOMetaBox, type SEOMetaBoxData } from './products/SEOMetaBox';
import { ProductFormLayout } from './products/ProductFormLayout';
import { PublishBox } from './products/sidebar/PublishBox';
import { CategoriesBox } from './products/sidebar/CategoriesBox';
import { TagsBox } from './products/sidebar/TagsBox';
import { FeaturedImageBox } from './products/sidebar/FeaturedImageBox';
import { ProductGalleryBox } from './products/sidebar/ProductGalleryBox';
import { ProductLinksBox } from './products/sidebar/ProductLinksBox';
import { ClassicEditor } from './products/ClassicEditor';
import { ShortDescriptionEditor } from './products/ShortDescriptionEditor';
import { ProductDataMetaBox, type ProductDataMetaBoxState, type ProductType } from './products/ProductDataMetaBox';
import { StickyActionBar } from './products/ProductDataMetaBox/StickyActionBar';
import { generateSlug } from '@/lib/utils/slug';

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

// SEO data is now managed by SEOMetaBox

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  category: string; // Keep for backward compatibility
  categories?: string[]; // Multiple categories support
  tags: string[];
  variants: ProductVariant[];
  // Image fields (new structure)
  _thumbnail_id?: string; // Attachment ID for featured image
  _product_image_gallery?: string; // Comma-separated attachment IDs for gallery
  // Keep images for backward compatibility during migration (will be removed later)
  images?: string[];
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  isHot: boolean;
  isActive: boolean;
  status: 'draft' | 'publish' | 'trash';
  visibility?: 'public' | 'private' | 'password';
  // New fields for Phase 1
  seo?: SEOMetaBoxData;
  // Product Data Meta Box fields
  productDataMetaBox?: Partial<ProductDataMetaBoxState>;
  // Gift features
  giftFeatures?: {
    giftWrapping: boolean;
    giftMessageEnabled: boolean;
    giftCardEnabled: boolean;
    giftDeliveryDateEnabled: boolean;
  };
  // Media extended
  mediaExtended?: Record<string, any>;
}

interface ProductFormProps {
  productId?: string;
  initialData?: Partial<ProductFormData>;
}

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(productId); // Track current product ID
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  // Image URLs for display (separate from IDs stored in formData)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [galleryImages, setGalleryImages] = useState<Array<{id: string, thumbnail_url: string, title?: string}>>([]);
  // Publish Box states
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [password, setPassword] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutosaveTime, setLastAutosaveTime] = useState<Date | null>(null);
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
    isHot: false,
    isActive: true,
    status: 'draft',
    visibility: 'public',
    _thumbnail_id: undefined,
    _product_image_gallery: undefined,
    seo: {},
    giftFeatures: {
      giftWrapping: false,
      giftMessageEnabled: false,
      giftCardEnabled: false,
      giftDeliveryDateEnabled: false,
    },
    mediaExtended: {},
    productDataMetaBox: {},
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
      const slug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, productId]); // formData.slug intentionally excluded to avoid infinite loop

  // Đồng bộ tự động: Tên sản phẩm và Mô tả ngắn copy sang SEO nếu chưa điền
  useEffect(() => {
    if (!formData.seo?.seoTitle && formData.name) {
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          seoTitle: prev.name,
        },
      }));
    }
    
    if (!formData.seo?.seoDescription && formData.shortDescription) {
      const textOnly = formData.shortDescription.replace(/<[^>]*>/g, '').substring(0, 160);
      if (textOnly) {
        setFormData((prev) => ({
          ...prev,
          seo: {
            ...prev.seo,
            seoDescription: textOnly,
          },
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, formData.shortDescription]); // Only sync when name or shortDescription changes

  // Load product data if editing
  useEffect(() => {
    if (productId && !initialData) {
      async function fetchProduct() {
        try {
          const response = await fetch(`/api/admin/products/${productId}`);
          const data = await response.json();
          if (data.product) {
            const product = data.product as MappedProduct;
            const apiProduct = data.product as any;
            
            // Map product data to ProductDataMetaBox state
            // If productDataMetaBox exists in API response, use it directly (with fallbacks)
            // Otherwise, map from product fields
            const metaBoxData: Partial<ProductDataMetaBoxState> = apiProduct.productDataMetaBox ? {
              // Use productDataMetaBox from API if available
              productType: apiProduct.productDataMetaBox.productType || (product.type as ProductDataMetaBoxState['productType']) || 'simple',
              isVirtual: apiProduct.productDataMetaBox.isVirtual || false,
              isDownloadable: apiProduct.productDataMetaBox.isDownloadable || false,
              sku: apiProduct.productDataMetaBox.sku || product.sku || undefined,
              manageStock: apiProduct.productDataMetaBox.manageStock !== undefined ? apiProduct.productDataMetaBox.manageStock : (product.stockQuantity !== null),
              stockQuantity: apiProduct.productDataMetaBox.stockQuantity !== undefined ? apiProduct.productDataMetaBox.stockQuantity : (product.stockQuantity || undefined),
              stockStatus: apiProduct.productDataMetaBox.stockStatus || (product.stockStatus as ProductDataMetaBoxState['stockStatus']) || 'instock',
              weight: apiProduct.productDataMetaBox.weight !== undefined ? apiProduct.productDataMetaBox.weight : (product.weight ? parseFloat(product.weight) : undefined),
              length: apiProduct.productDataMetaBox.length !== undefined ? apiProduct.productDataMetaBox.length : (product.length || undefined),
              width: apiProduct.productDataMetaBox.width !== undefined ? apiProduct.productDataMetaBox.width : (product.width || undefined),
              height: apiProduct.productDataMetaBox.height !== undefined ? apiProduct.productDataMetaBox.height : (product.height || undefined),
              regularPrice: apiProduct.productDataMetaBox.regularPrice !== undefined ? apiProduct.productDataMetaBox.regularPrice : (parseFloat(product.regularPrice) || undefined),
              salePrice: apiProduct.productDataMetaBox.salePrice !== undefined ? apiProduct.productDataMetaBox.salePrice : (product.salePrice && product.regularPrice && parseFloat(product.salePrice) < parseFloat(product.regularPrice) ? parseFloat(product.salePrice) : undefined),
              salePriceStartDate: apiProduct.productDataMetaBox.salePriceStartDate || undefined,
              salePriceEndDate: apiProduct.productDataMetaBox.salePriceEndDate || undefined,
              costPrice: apiProduct.productDataMetaBox.costPrice || undefined,
              lowStockThreshold: apiProduct.productDataMetaBox.lowStockThreshold || undefined,
              backorders: apiProduct.productDataMetaBox.backorders || 'no',
              soldIndividually: apiProduct.productDataMetaBox.soldIndividually || false,
              purchaseNote: apiProduct.productDataMetaBox.purchaseNote || undefined,
              menuOrder: apiProduct.productDataMetaBox.menuOrder || 0,
              enableReviews: apiProduct.productDataMetaBox.enableReviews !== undefined ? apiProduct.productDataMetaBox.enableReviews : true,
              // Include attributes and variations from productDataMetaBox
              attributes: apiProduct.productDataMetaBox.attributes || [],
              variations: apiProduct.productDataMetaBox.variations || [],
            } : {
              // Fallback: Map from product fields if productDataMetaBox doesn't exist
              productType: (product.type as ProductDataMetaBoxState['productType']) || 'simple',
              isVirtual: false,
              isDownloadable: false,
              sku: product.sku || undefined,
              manageStock: product.stockQuantity !== null,
              stockQuantity: product.stockQuantity || undefined,
              stockStatus: (product.stockStatus as ProductDataMetaBoxState['stockStatus']) || 'instock',
              weight: product.weight ? parseFloat(product.weight) : undefined,
              length: product.length || undefined,
              width: product.width || undefined,
              height: product.height || undefined,
              regularPrice: parseFloat(product.regularPrice) || undefined,
              salePrice: product.salePrice && product.regularPrice && parseFloat(product.salePrice) < parseFloat(product.regularPrice)
                ? parseFloat(product.salePrice)
                : undefined,
              attributes: [],
              variations: [],
            };
            // Load scheduledDate and password if available
            if (apiProduct.scheduledDate) {
              setScheduledDate(new Date(apiProduct.scheduledDate));
            }
            if (apiProduct.password) {
              setPassword(apiProduct.password);
            }
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
              // Image fields - try new structure first, fallback to old structure
              _thumbnail_id: (product as any)._thumbnail_id || (product.image?.id?.toString()),
              _product_image_gallery: (product as any)._product_image_gallery ||
                (product.galleryImages?.map((img: any) => img.id?.toString()).filter(Boolean).join(',') || undefined),
              // Keep images for backward compatibility (will be removed later)
              images: [
                product.image?.sourceUrl,
                ...product.galleryImages.map((img) => img.sourceUrl),
              ].filter(Boolean) as string[],
              length: product.length || undefined,
              width: product.width || undefined,
              height: product.height || undefined,
              weight: product.weight ? parseFloat(product.weight) : undefined,
              isHot: false,
              isActive: product.stockStatus === 'instock',
              status: (apiProduct.status as 'draft' | 'publish' | 'trash') || 'draft',
              visibility: (apiProduct.visibility as 'public' | 'private' | 'password') || 'public',
              productDataMetaBox: metaBoxData,
            });

            // Set image URLs for display
            
            // Set thumbnail
            if (apiProduct._thumbnail_id) {
              // New structure: use thumbnail object if available, fallback to image.sourceUrl
              if (apiProduct.thumbnail) {
                setThumbnailUrl(apiProduct.thumbnail.thumbnail_url || apiProduct.thumbnail.url);
              } else if (product.image?.sourceUrl) {
                setThumbnailUrl(product.image.sourceUrl);
              }
            } else if (product.image?.sourceUrl) {
              // Old structure: use sourceUrl
              setThumbnailUrl(product.image.sourceUrl);
            }

            // Set gallery images
            if (apiProduct._product_image_gallery) {
              // New structure: use gallery array if available
              if (apiProduct.gallery && Array.isArray(apiProduct.gallery)) {
                setGalleryImages(apiProduct.gallery.map((img: any) => ({
                  id: img.id?.toString() || '',
                  thumbnail_url: img.thumbnail_url || img.url,
                  title: img.title,
                })));
              } else if (product.galleryImages && product.galleryImages.length > 0) {
                // Fallback: map from galleryImages with IDs from _product_image_gallery
                const galleryIds = apiProduct._product_image_gallery.split(',').filter(Boolean);
                setGalleryImages(product.galleryImages.map((img: any, idx: number) => ({
                  id: galleryIds[idx] || `gallery-${idx}`,
                  thumbnail_url: img.sourceUrl || img.url,
                  title: img.title || img.alt,
                })));
              }
            } else if (product.galleryImages && product.galleryImages.length > 0) {
              // Old structure: map from galleryImages
              setGalleryImages(product.galleryImages.map((img: any, idx: number) => ({
                id: img.id?.toString() || `gallery-${idx}`,
                thumbnail_url: img.sourceUrl || img.url,
                title: img.title || img.alt,
              })));
            }
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

    // Merge ProductDataMetaBox data into payload
    const metaBoxData = formData.productDataMetaBox || {};
    const payload: any = {
      ...formData,
      slug,
      minPrice,
      maxPrice,
      category: categoryIds[0] || formData.category || undefined, // Keep for backward compatibility
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      tags: formData.tags.filter((t) => t.trim().length > 0),
      // Include image IDs in payload
      _thumbnail_id: formData._thumbnail_id || undefined,
      _product_image_gallery: formData._product_image_gallery || undefined,
      // Include ProductDataMetaBox fields in payload
      sku: metaBoxData.sku || formData.sku,
      length: metaBoxData.length || formData.length,
      width: metaBoxData.width || formData.width,
      height: metaBoxData.height || formData.height,
      weight: metaBoxData.weight || formData.weight,
      // Store full meta box data for future use
      productDataMetaBox: metaBoxData,
    };

    // Populate images array for backward compatibility and frontend display
    // This ensures ProductCard can display images even if _thumbnail_id is pathname
    const imagesArray: string[] = [];
    
    // Add featured image URL if available
    if (thumbnailUrl) {
      imagesArray.push(thumbnailUrl);
    } else if (formData._thumbnail_id && (formData._thumbnail_id.startsWith('http://') || formData._thumbnail_id.startsWith('https://'))) {
      // If _thumbnail_id is already a URL, use it
      imagesArray.push(formData._thumbnail_id);
    }
    
    // Add gallery image URLs if available
    if (galleryImages && galleryImages.length > 0) {
      galleryImages.forEach((img) => {
        if (img.thumbnail_url && !imagesArray.includes(img.thumbnail_url)) {
          imagesArray.push(img.thumbnail_url);
        }
      });
    } else if (formData._product_image_gallery) {
      // Fallback: if galleryImages not available, try to extract URLs from _product_image_gallery
      const galleryIds = formData._product_image_gallery.split(',').filter(Boolean);
      galleryIds.forEach((id) => {
        if (id.startsWith('http://') || id.startsWith('https://')) {
          imagesArray.push(id);
        }
      });
    }
    
    // Set images array if we have URLs (for backward compatibility)
    if (imagesArray.length > 0) {
      payload.images = imagesArray;
    } else {
      // Remove old images field if empty (migration to new structure)
      delete payload.images;
    }

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave('publish');
  };

  const handleSave = async (saveStatus: 'draft' | 'publish' | 'keep' = 'keep') => {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const payload = preparePayload();
      if (!payload) {
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Determine final status:
      // - 'keep': Keep current status (for "Lưu thay đổi" button)
      // - 'draft': Force to draft (for "Lưu nháp" button)
      // - 'publish': Force to publish (for "Xuất bản" button)
      const effectiveProductId = currentProductId || productId;
      let finalStatus: 'draft' | 'publish' | 'trash' = formData.status || 'draft';
      
      if (saveStatus === 'draft') {
        finalStatus = 'draft';
      } else if (saveStatus === 'publish') {
        finalStatus = 'publish';
      } else if (saveStatus === 'keep') {
        // Keep current status, but default to 'draft' for new products
        if (!effectiveProductId && !formData.status) {
          finalStatus = 'draft';
        } else {
          finalStatus = formData.status || 'draft';
        }
      }
      
      if (scheduledDate && scheduledDate > new Date()) {
        // If scheduled for future, keep as draft until scheduled time
        finalStatus = 'draft';
      }

      // Override status based on save action
      const finalPayload = {
        ...payload,
        status: finalStatus,
        scheduledDate: scheduledDate ? scheduledDate.toISOString() : undefined,
        password: formData.visibility === 'password' ? password : undefined,
      };

      // Use effectiveProductId already defined above
      const url = effectiveProductId
        ? `/api/admin/products/${effectiveProductId}`
        : '/api/admin/products';
      const method = effectiveProductId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        setIsSubmitting(false);
        setLoading(false);
        return;
      }

      const result = await response.json();
      
      // Clear unsaved changes flag after successful save
      setHasUnsavedChanges(false);
      setLastAutosaveTime(new Date());
      
      // If creating new product, update productId immediately to prevent duplicate autosave
      if (!effectiveProductId && result.product?._id) {
        const newProductId = result.product._id;
        setCurrentProductId(newProductId); // Update state immediately
        // Update URL with new product ID
        router.push(`/admin/products/${newProductId}/edit`);
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
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    await handleSave('publish');
  };

  const handleSaveDraft = async () => {
    // "Lưu nháp" button in PublishBox - force to draft
    await handleSave('draft');
  };

  const handleSaveChanges = async () => {
    // "Lưu thay đổi" button in StickyActionBar - keep current status
    // This prevents published products from disappearing from frontend
    await handleSave('keep');
  };

  const handleAutosave = async () => {
    // Prevent autosave if:
    // 1. Currently submitting (manual save in progress)
    // 2. No productId and no currentProductId (don't create new products via autosave)
    if (isSubmitting) {
      return;
    }

    // Use currentProductId (may have been set by previous save)
    const effectiveProductId = currentProductId || productId;
    
    // Only autosave if product already exists (don't create new products via autosave)
    if (!effectiveProductId) {
      return;
    }

    // Silent autosave (no loading state, no alerts)
    try {
      const payload = preparePayload();
      if (!payload) return;

      const finalPayload = {
        ...payload,
        status: 'draft', // Always save as draft for autosave
      };

      const url = `/api/admin/products/${effectiveProductId}`;
      const method = 'PUT'; // Always use PUT for autosave (product must exist)

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      setLastAutosaveTime(new Date());
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;

    if (confirm('Bạn có chắc chắn muốn di chuyển sản phẩm này vào thùng rác?')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || 'Có lỗi xảy ra');
          return;
        }

        // Redirect to products list
        router.push('/admin/products');
      } catch (error: any) {
        console.error('Error deleting product:', error);
        alert('Có lỗi xảy ra khi xóa sản phẩm');
      } finally {
        setLoading(false);
      }
    }
  };

  // Track unsaved changes - compare with initial state
  useEffect(() => {
    // Simple check: if form has been modified (name or description changed from initial)
    // In production, you might want a more sophisticated comparison
    const hasChanges = 
      formData.name !== (initialData?.name || '') ||
      formData.description !== (initialData?.description || '') ||
      formData.shortDescription !== (initialData?.shortDescription || '');
    
    setHasUnsavedChanges(hasChanges);
  }, [formData.name, formData.description, formData.shortDescription, initialData]);

  // Variant management functions removed - now handled by VariantFormEnhanced component
  // Tag management functions removed - now handled by TagsBox component
  // Image management functions removed - now handled by FeaturedImageBox and ProductGalleryBox

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
        scheduledDate={scheduledDate}
        password={password}
        onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
        onIsActiveChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
        onVisibilityChange={(visibility) => setFormData((prev) => ({ ...prev, visibility }))}
        onPasswordChange={setPassword}
        onScheduledDateChange={setScheduledDate}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
        onDelete={handleDelete}
        loading={loading || isSubmitting}
        productId={currentProductId || productId}
        productSlug={formData.slug}
        hasUnsavedChanges={hasUnsavedChanges}
        onAutosave={handleAutosave}
        lastAutosaveTime={lastAutosaveTime}
      />

      {/* Categories Box */}
      <CategoriesBox
        categories={categories}
        selectedCategories={formData.categories || (formData.category ? [formData.category] : [])}
        primaryCategory={formData.categories?.[0] || formData.category || undefined}
        onCategoriesChange={(categoryIds) => {
          setFormData((prev) => ({
            ...prev,
            categories: categoryIds,
            category: categoryIds[0] || '', // Keep for backward compatibility
          }));
        }}
        onPrimaryCategoryChange={(categoryId) => {
          if (categoryId) {
            setFormData((prev) => ({
              ...prev,
              categories: categoryId ? [categoryId, ...(prev.categories || []).filter(id => id !== categoryId)] : prev.categories,
              category: categoryId || prev.category,
            }));
          }
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
        thumbnailId={formData._thumbnail_id}
        thumbnailUrl={thumbnailUrl}
        onImageChange={(attachmentId, thumbUrl) => {
          setFormData((prev) => ({
            ...prev,
            _thumbnail_id: attachmentId,
          }));
          setThumbnailUrl(thumbUrl);
        }}
        onImageRemove={() => {
          setFormData((prev) => ({
            ...prev,
            _thumbnail_id: undefined,
          }));
          setThumbnailUrl(undefined);
        }}
      />

      {/* Product Gallery Box */}
      <ProductGalleryBox
        galleryImages={galleryImages}
        onImagesChange={(images) => {
          setGalleryImages(images);
          // Update _product_image_gallery with comma-separated IDs
          setFormData((prev) => ({
            ...prev,
            _product_image_gallery: images.map(img => img.id).join(','),
          }));
        }}
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

      {/* Product Data Meta Box */}
      <ProductDataMetaBox
        data={formData.productDataMetaBox}
        onChange={(metaBoxData) => {
          // Use functional update to batch state changes and prevent race conditions
          setFormData((prev) => {
            // Deep comparison to check if metaBoxData actually changed
            const prevMetaBox = prev.productDataMetaBox || {};
            const hasMetaBoxChanges = 
              prevMetaBox.productType !== metaBoxData.productType ||
              prevMetaBox.isVirtual !== metaBoxData.isVirtual ||
              prevMetaBox.isDownloadable !== metaBoxData.isDownloadable ||
              prevMetaBox.sku !== metaBoxData.sku ||
              prevMetaBox.costPrice !== metaBoxData.costPrice ||
              prevMetaBox.regularPrice !== metaBoxData.regularPrice ||
              prevMetaBox.salePrice !== metaBoxData.salePrice ||
              prevMetaBox.salePriceStartDate !== metaBoxData.salePriceStartDate ||
              prevMetaBox.salePriceEndDate !== metaBoxData.salePriceEndDate ||
              JSON.stringify(prevMetaBox.downloadableFiles) !== JSON.stringify(metaBoxData.downloadableFiles) ||
              prevMetaBox.length !== metaBoxData.length ||
              prevMetaBox.width !== metaBoxData.width ||
              prevMetaBox.height !== metaBoxData.height ||
              prevMetaBox.weight !== metaBoxData.weight ||
              prevMetaBox.shippingClass !== metaBoxData.shippingClass ||
              prevMetaBox.manageStock !== metaBoxData.manageStock ||
              prevMetaBox.stockQuantity !== metaBoxData.stockQuantity ||
              prevMetaBox.stockStatus !== metaBoxData.stockStatus ||
              prevMetaBox.lowStockThreshold !== metaBoxData.lowStockThreshold ||
              prevMetaBox.backorders !== metaBoxData.backorders ||
              prevMetaBox.soldIndividually !== metaBoxData.soldIndividually ||
              JSON.stringify(prevMetaBox.attributes) !== JSON.stringify(metaBoxData.attributes) ||
              JSON.stringify(prevMetaBox.variations) !== JSON.stringify(metaBoxData.variations) ||
              prevMetaBox.purchaseNote !== metaBoxData.purchaseNote ||
              prevMetaBox.menuOrder !== metaBoxData.menuOrder ||
              prevMetaBox.enableReviews !== metaBoxData.enableReviews;
            
            // Check if synced fields changed
            const hasSyncedFieldChanges = 
              prev.sku !== (metaBoxData.sku || prev.sku) ||
              prev.length !== (metaBoxData.length || prev.length) ||
              prev.width !== (metaBoxData.width || prev.width) ||
              prev.height !== (metaBoxData.height || prev.height) ||
              prev.weight !== (metaBoxData.weight || prev.weight);
            
            if (!hasMetaBoxChanges && !hasSyncedFieldChanges) {
              return prev;
            }
            
            return {
              ...prev,
              productDataMetaBox: metaBoxData,
              // Sync some fields from meta box to form data
              sku: metaBoxData.sku || prev.sku,
              length: metaBoxData.length || prev.length,
              width: metaBoxData.width || prev.width,
              height: metaBoxData.height || prev.height,
              weight: metaBoxData.weight || prev.weight,
            };
          });
        }}
        productId={productId}
      />

      {/* Short Description Editor - Nằm dưới ProductDataMetaBox và trên SEO Meta Box */}
      <Card>
        <CardHeader>
          <CardTitle>Mô tả ngắn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Đoạn văn bản &quot;mồi&quot; hiển thị ngay bên cạnh ảnh sản phẩm và phía trên nút Mua hàng ở giao diện Frontend.
            </p>
            <ShortDescriptionEditor
              value={formData.shortDescription}
              onChange={(html) => {
                setFormData((prev) => {
                  const newData = { ...prev, shortDescription: html };
                  
                  // Đồng bộ tự động: Copy sang SEO nếu chưa điền
                  if (!newData.seo?.seoDescription && html) {
                    // Strip HTML tags for SEO description (max 160 chars)
                    const textOnly = html.replace(/<[^>]*>/g, '').substring(0, 160);
                    if (textOnly) {
                      newData.seo = {
                        ...newData.seo,
                        seoDescription: textOnly,
                      };
                    }
                  }
                  
                  return newData;
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Meta Box - Nằm sau Short Description Editor */}
      <SEOMetaBox
        data={formData.seo || {}}
        onChange={(seo) => {
          setFormData((prev) => {
            // Sync slug from SEO Meta Box to formData.slug if changed
            const newSlug = seo.slug && seo.slug !== prev.slug ? seo.slug : prev.slug;
            return { ...prev, seo, slug: newSlug };
          });
        }}
        productName={formData.name}
        productPrice={formData.productDataMetaBox?.regularPrice || 0}
        productSalePrice={formData.productDataMetaBox?.salePrice}
        productSku={formData.productDataMetaBox?.sku || formData.sku || ''}
        productCategory={formData.categories && formData.categories[0] ? categories.find(c => c.id === formData.categories![0])?.name || '' : ''}
        productBrand={''} // TODO: Get from product attributes or meta
        productShortDescription={formData.shortDescription || ''}
        productDescription={formData.description || ''}
        productImage={thumbnailUrl || ''}
        productStockStatus={formData.productDataMetaBox?.stockStatus || 'instock'}
        productStockQuantity={formData.productDataMetaBox?.stockQuantity || 0}
        productRating={5.0} // TODO: Get from product reviews
        productSlug={formData.slug || ''}
        siteName="Shop Gấu Bông"
        hasRelatedProducts={
          // Check if product has related products (upsell/cross-sell)
          // Note: collectionCombo was removed, but we can check other sources if available
          false // TODO: Implement when upsell/cross-sell feature is available
        }
      />
      </ProductFormLayout>

      {/* Sticky Action Bar */}
      <StickyActionBar
        onSave={handleSaveChanges}
        onPreview={() => {
          if (productId && formData.slug) {
            window.open(`/products/${formData.slug}`, '_blank');
          }
        }}
        loading={loading}
        productId={productId}
        productSlug={formData.slug}
      />
    </form>
  );
}

