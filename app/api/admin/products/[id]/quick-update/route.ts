/**
 * Admin Quick Update Product API Route
 * PATCH /api/admin/products/[id]/quick-update - Quick update product (price, stock, status)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct, MongoProduct } from '@/lib/utils/productMapper';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
// ✅ FIX: Import stripHtmlTags from separate file to avoid ES Module issues
// stripHtmlTags doesn't need DOMPurify, so we import it from a separate file
// that doesn't import isomorphic-dompurify at top-level
import { stripHtmlTags } from '@/lib/utils/stripHtmlTags';
import { validateVariantObjects } from '@/lib/utils/variantIdValidator';
import { withTransaction, getCollectionsWithSession } from '@/lib/utils/transactionHelper';
import type { ClientSession } from 'mongodb';

export const dynamic = 'force-dynamic';

// ✅ FIX: Helper function to ensure JSON response even for initialization errors
// This prevents 405 Method Not Allowed errors on Vercel when module initialization fails
async function safeHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: unknown) {
    console.error('[Admin Product Quick Update API] Handler initialization error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: 'HANDLER_INIT_ERROR',
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? { 
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// PHASE 1: productDataMetaBox Sync Pattern (7.2.3) - Helper function for consistent updates
/**
 * Helper function to ensure productDataMetaBox exists in updateData and return it
 * This ensures consistent pattern for all productDataMetaBox field updates
 */
function ensureProductDataMetaBox(
  updateData: Record<string, unknown>,
  existingProduct: any
): Record<string, unknown> {
  if (!updateData.productDataMetaBox) {
    updateData.productDataMetaBox = { ...existingProduct.productDataMetaBox || {} };
  }
  return updateData.productDataMetaBox as Record<string, unknown>;
}

// Quick update schema - Extended for full Quick Edit feature
const quickUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  status: z.enum(['draft', 'publish', 'trash']).optional(),
  manageStock: z.boolean().optional(),
  regularPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).nullable().optional(), // Fix #18: Allow null to clear salePrice
  stockQuantity: z.number().int().nonnegative().optional(), // ✅ Validate: integer and >= 0
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  version: z.number().optional(), // For optimistic locking
  // PHASE 1: Categories & Tags (7.2.1)
  categories: z.array(z.string()).optional(), // Array of category IDs
  tags: z.array(z.string()).optional(), // Array of tag strings
  // PHASE 1: Weight & Dimensions (4.1.3)
  weight: z.number().min(0).optional(), // Weight in kg
  length: z.number().min(0).optional(), // Length in cm
  width: z.number().min(0).optional(), // Width in cm
  height: z.number().min(0).optional(), // Height in cm
  // PHASE 1: Low Stock Threshold (4.1.4)
  lowStockThreshold: z.number().int().nonnegative().optional(), // Low stock threshold
  // PHASE 1: Featured Image & Gallery (4.1.2)
  _thumbnail_id: z.string().nullable().optional(), // Featured image ID (null to remove)
  _product_image_gallery: z.string().nullable().optional(), // Comma-separated gallery image IDs (null to clear)
  // PHASE 2: SEO Fields (4.2.1)
  seoTitle: z.string().max(60, 'Meta Title không được vượt quá 60 ký tự').optional(),
  seoDescription: z.string().max(160, 'Meta Description không được vượt quá 160 ký tự').optional(),
  slug: z.string().min(1, 'URL Slug không được để trống').regex(/^[a-z0-9-]+$/, 'URL Slug chỉ được chứa chữ thường, số và dấu gạch ngang').optional(),
  // PHASE 2: Cost Price (4.2.2)
  costPrice: z.number().min(0, 'Giá vốn phải >= 0').optional(),
  // PHASE 2: Product Type & Visibility (4.2.3)
  productType: z.enum(['simple', 'variable', 'grouped', 'external']).optional(),
  visibility: z.enum(['public', 'private', 'password']).optional(),
  password: z.string().optional(), // Required if visibility === 'password'
  // PHASE 2: Shipping Class & Tax Settings (4.2.4)
  shippingClass: z.string().optional(), // Shipping class (standard, fragile, bulky, express, etc.)
  taxStatus: z.enum(['taxable', 'shipping', 'none']).optional(), // Tax status
  taxClass: z.string().optional(), // Tax class (standard, reduced-rate, zero-rate, etc.)
  // PHASE 3: Barcode/GTIN/EAN (4.3.1)
  barcode: z.string().optional(), // Barcode (text, optional)
  gtin: z.string().optional(), // GTIN (Global Trade Item Number, optional)
  ean: z.string().optional(), // EAN (European Article Number, optional)
  // PHASE 3: Product Options (4.3.2) - Attributes enable/disable
  attributes: z.array(z.object({
    name: z.string(), // Attribute name (e.g., "Size", "Color")
    visible: z.boolean().optional(), // Enable/disable attribute
  })).optional(), // Array of attributes with visible flag
  // PHASE 3: Sold Individually (4.3.3)
  soldIndividually: z.boolean().optional(), // Sold individually (limit quantity to 1 in cart)
  // PHASE 3: Backorders Settings (4.3.4)
  backorders: z.enum(['no', 'notify', 'yes']).optional(), // Backorders behavior (Allow, Notify, Do not allow)
  // Variant updates (for variable products)
  // NOTE: Variants don't have stockStatus field - they inherit from parent product
  variants: z.array(z.object({
    id: z.string(),
    sku: z.string().optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().nonnegative().optional(), // ✅ Validate: integer and >= 0
    // stockStatus removed - variants don't have this field in MongoDB
  })).optional(),
  // Backward compatibility: support old price field
  price: z.number().min(0).optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0;
  },
  { message: 'At least one field must be provided' }
).refine(
  (data) => {
    // Validate salePrice < regularPrice if both provided (skip if salePrice is null)
    if (data.salePrice !== undefined && data.salePrice !== null && data.regularPrice !== undefined) {
      return data.salePrice < data.regularPrice;
    }
    return true;
  },
  { message: 'Sale price must be less than regular price', path: ['salePrice'] }
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ FIX: Wrap entire handler in safeHandler to catch initialization errors
  // This ensures JSON response even if withAuthAdmin or module imports fail
  return safeHandler(async () => {
    return await withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // ✅ FIX: Ensure params.id exists and is a string
      if (!params || !params.id || typeof params.id !== 'string') {
        return NextResponse.json(
          { error: 'Product ID is required' },
          { status: 400 }
        );
      }
      
      // ✅ FIX: Wrap getCollections in try-catch to handle MongoDB connection errors
      let products;
      try {
        const collections = await getCollections();
        products = collections.products;
      } catch (dbError) {
        console.error('[Admin Product Quick Update API] MongoDB connection error:', dbError);
        return NextResponse.json(
          { 
            error: 'Database connection failed',
            code: 'DB_CONNECTION_ERROR',
            details: process.env.NODE_ENV === 'development' && dbError instanceof Error
              ? { message: dbError.message }
              : undefined,
          },
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
    let { id } = params;
    const body = await request.json();
    
    // Extract ObjectId from GraphQL format if needed (backward compatibility)
    if (id.startsWith('gid://shop-gau-bong/Product/')) {
      id = id.replace('gid://shop-gau-bong/Product/', '');
    }
    
    // Validate input
    const validatedData = quickUpdateSchema.parse(body);
    
    // Find product
    let productId: ObjectId | null = null;
    let product = null;
    
    if (ObjectId.isValid(id)) {
      productId = new ObjectId(id);
      product = await products.findOne({ _id: productId });
    } else {
      product = await products.findOne({ slug: id });
      if (product) {
        productId = product._id;
      }
    }
    
    if (!productId || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Build update data structure
    // Use separate objects for $set, $unset, and $inc operations
    const updateData: any = {
      updatedAt: new Date(),
    };
    const unsetFields: Record<string, number> = {};
    const incFields: Record<string, number> = {};
    
    // PHASE 2: Version Range Validation (7.12.10)
    // Validate version phải <= currentVersion + 1 (cho phép increment 1)
    // Reject nếu version > currentVersion + 1 (manipulation attempt)
    // Reject nếu version < currentVersion (outdated)
    if (validatedData.version !== undefined) {
      const currentVersion = product.version || 0;
      const providedVersion = validatedData.version;
      
      // Version range validation: chỉ cho phép version = currentVersion hoặc currentVersion + 1
      if (providedVersion < currentVersion) {
        // Outdated version - product đã được update từ nơi khác
        return NextResponse.json(
          { 
            error: 'Dữ liệu đã được cập nhật bởi một Admin khác, vui lòng tải lại trang',
            code: 'VERSION_MISMATCH',
            currentVersion,
            providedVersion,
            reason: 'outdated',
          },
          { status: 409 }
        );
      } else if (providedVersion > currentVersion + 1) {
        // Suspicious: version jump > 1 - possible manipulation attempt
        // Log this attempt for security monitoring
        if (req.adminUser) {
          const { adminActivityLogs } = await getCollections();
          try {
            await adminActivityLogs.insertOne({
              action: 'version_manipulation_attempt',
              targetType: 'product',
              targetId: productId.toString(),
              userId: req.adminUser._id?.toString() || 'unknown',
              userName: (req.adminUser as any).name || req.adminUser.email || 'unknown',
              metadata: {
                currentVersion,
                providedVersion,
                difference: providedVersion - currentVersion,
                suspicious: true,
              },
              timestamp: new Date(),
            });
          } catch (logError) {
            // Don't fail the request if logging fails, but log to console
            console.error('[Quick Update] Failed to log version manipulation attempt:', logError);
          }
        }
        
        return NextResponse.json(
          { 
            error: 'Phiên bản không hợp lệ. Vui lòng tải lại trang và thử lại.',
            code: 'VERSION_RANGE_INVALID',
            currentVersion,
            providedVersion,
            reason: 'version_jump_too_large',
          },
          { status: 400 }
        );
      } else if (providedVersion === currentVersion + 1) {
        // Valid: version increment by 1 - this is expected for optimistic locking
        // Version will be incremented by $inc operator in update
      } else if (providedVersion === currentVersion) {
        // Valid: same version - no concurrent edit conflict
        // Version will still be incremented by $inc operator in update
      }
    }
    
    // Update name - PHASE 0: XSS Sanitization (7.12.1)
    if (validatedData.name !== undefined) {
      // Strip HTML tags to prevent XSS attacks
      updateData.name = stripHtmlTags(validatedData.name).trim();
      if (!updateData.name) {
        return NextResponse.json(
          { error: 'Product name cannot be empty' },
          { status: 400 }
        );
      }
    }
    
    // Update sku - PHASE 0: XSS Sanitization (7.12.1)
    if (validatedData.sku !== undefined) {
      // Strip HTML tags and special characters (only allow alphanumeric, dash, underscore)
      const sanitizedSku = stripHtmlTags(validatedData.sku).trim();
      // Remove special characters except alphanumeric, dash, underscore
      updateData.sku = sanitizedSku.replace(/[^a-zA-Z0-9\-_]/g, '');
    }
    
    // Update status
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    
    // Handle manageStock
    if (validatedData.manageStock !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      metaBox.manageStock = validatedData.manageStock;
      
      // If disabling manage stock, clear stock quantity
      if (!validatedData.manageStock) {
        updateData.productDataMetaBox.stockQuantity = 0;
        updateData.stockQuantity = 0;
      }
    }
    
    // Update regularPrice in productDataMetaBox
    // PHASE 0: regularPrice Required Validation (7.5.1)
    if (validatedData.regularPrice !== undefined) {
      // Get product type from correct location (productDataMetaBox, not product.type)
      const productType = product.productDataMetaBox?.productType || validatedData.productType || 'simple';
      
      // For simple products, regularPrice is required and must be > 0
      // But only validate if user is actually trying to set it (not just passing through)
      if (productType === 'simple') {
        // Allow null/0 only if user is explicitly trying to clear the price (but this is discouraged for simple products)
        // In practice, for simple products, we should require > 0
        // However, in Quick Edit, if user is not editing price, regularPrice might be undefined
        // So we only validate if regularPrice is explicitly provided and is invalid
        if (validatedData.regularPrice !== null && validatedData.regularPrice <= 0) {
          return NextResponse.json(
            { 
              error: 'Regular price must be greater than 0 for simple products',
              path: ['regularPrice']
            },
            { status: 400 }
          );
        }
      }
      
      // PHASE 1: Use helper function for consistent pattern (7.2.3)
      const metaBox = ensureProductDataMetaBox(updateData, product);
      metaBox.regularPrice = validatedData.regularPrice;
      
      // PHASE 0: Bounds Recalculation (7.1.4) - For simple products
      if (productType === 'simple' && validatedData.regularPrice && validatedData.regularPrice > 0) {
        updateData.minPrice = validatedData.regularPrice;
        updateData.maxPrice = validatedData.regularPrice;
      }
    }
    
    // Update salePrice in productDataMetaBox and cleanup sale dates
    // Fix #18: Handle salePrice = null to clear field
    if (validatedData.salePrice !== undefined) {
      if (validatedData.salePrice === null) {
        // User wants to clear salePrice - use $unset
        unsetFields['productDataMetaBox.salePrice'] = 1;
        unsetFields['productDataMetaBox.salePriceStartDate'] = 1;
        unsetFields['productDataMetaBox.salePriceEndDate'] = 1;
      } else {
        // Set salePrice value
        // PHASE 1: Use helper function for consistent pattern (7.2.3)
        const metaBox = ensureProductDataMetaBox(updateData, product);
        metaBox.salePrice = validatedData.salePrice;
        // CRITICAL: Use 1 (or true) for $unset values, not empty string
        unsetFields['productDataMetaBox.salePriceStartDate'] = 1;
        unsetFields['productDataMetaBox.salePriceEndDate'] = 1;
      }
    }
    
    // Backward compatibility: support old price field
    if (validatedData.price !== undefined) {
      updateData.price = validatedData.price;
      const metaBox = ensureProductDataMetaBox(updateData, product);
      metaBox.regularPrice = validatedData.price;
    }
    
    // Update stockQuantity with auto-sync (respect onbackorder AND manual override)
    if (validatedData.stockQuantity !== undefined) {
      updateData.stockQuantity = validatedData.stockQuantity;
      if (product.productDataMetaBox) {
        const metaBox = ensureProductDataMetaBox(updateData, product);
        metaBox.stockQuantity = validatedData.stockQuantity;
      }
      
      // CRITICAL: Only auto-sync if stockStatus is NOT explicitly provided
      // This prevents auto-sync from overriding user's manual choice
      if (validatedData.stockStatus === undefined) {
        const currentStatus = product.productDataMetaBox?.stockStatus || 
                             product.stockStatus || 
                             'instock';
        
        // Only auto-sync if current status is NOT onbackorder
        if (currentStatus !== 'onbackorder') {
          // Auto-sync: Qty > 0 -> instock, Qty <= 0 -> outofstock
          if (validatedData.stockQuantity > 0) {
            updateData.stockStatus = 'instock';
            const metaBox = ensureProductDataMetaBox(updateData, product);
            metaBox.stockStatus = 'instock';
          } else {
            updateData.stockStatus = 'outofstock';
            const metaBox = ensureProductDataMetaBox(updateData, product);
            metaBox.stockStatus = 'outofstock';
          }
        }
      }
      // If stockStatus is explicitly provided OR current status is onbackorder, 
      // respect user's manual choice (don't auto-sync)
    }
    
    // Manual stockStatus update (takes precedence over auto-sync)
    if (validatedData.stockStatus !== undefined) {
      updateData.stockStatus = validatedData.stockStatus;
      if (product.productDataMetaBox) {
          const metaBox = ensureProductDataMetaBox(updateData, product);
          metaBox.stockStatus = validatedData.stockStatus;
      }
    }
    
    // PHASE 3: Sold Individually Update (4.3.3)
    if (validatedData.soldIndividually !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      metaBox.soldIndividually = validatedData.soldIndividually;
    }
    
    // PHASE 3: Backorders Settings Update (4.3.4)
    if (validatedData.backorders !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      metaBox.backorders = validatedData.backorders;
      
      // PHASE 3: Auto-sync logic - Nếu "Do not allow" và stock = 0 → stockStatus = "outofstock"
      const currentStockQuantity = validatedData.stockQuantity !== undefined 
        ? validatedData.stockQuantity 
        : (product.productDataMetaBox?.stockQuantity ?? product.stockQuantity ?? 0);
      
      if (validatedData.backorders === 'no' && currentStockQuantity === 0) {
        // Auto-sync: Do not allow backorders + stock = 0 → outofstock
        updateData.stockStatus = 'outofstock';
        metaBox.stockStatus = 'outofstock';
      }
    }
    
    // Handle variant updates (for variable products)
    if (validatedData.variants && Array.isArray(validatedData.variants)) {
      const currentVariants = product.variants || [];
      const currentVariantIds = new Set<string>(
        currentVariants
          .map((v: any) => v.id)
          .filter((id: unknown): id is string => Boolean(id) && typeof id === 'string')
      );
      
      // PHASE 2: NoSQL Injection Fix (7.12.3) - Use comprehensive validation helper
      const variantsToUpdate = validatedData.variants;
      
      // Validate variant IDs với whitelist approach (ownership validation)
      const validationResult = validateVariantObjects(variantsToUpdate, currentVariantIds);
      
      if (!validationResult.valid) {
        return NextResponse.json(
          { 
            error: 'Invalid variant IDs',
            details: validationResult.errors.join('; '),
            invalidIds: validationResult.invalidVariants.map(v => v.id)
          },
          { status: 400 }
        );
      }
      
      // Legacy check (kept for backward compatibility, but should not trigger if validation passes)
      const invalidIds = variantsToUpdate
        .filter((v: any) => v.id && !currentVariantIds.has(v.id))
        .map((v: any) => v.id);
      
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { 
            error: 'Invalid variant IDs',
            details: `Variant IDs do not belong to this product: ${invalidIds.join(', ')}`
          },
          { status: 400 }
        );
      }
      
      // PHASE 0: XSS Sanitization for variant SKU (7.12.1)
      variantsToUpdate.forEach((v: any) => {
        if (v.sku !== undefined) {
          const sanitizedSku = stripHtmlTags(v.sku).trim();
          v.sku = sanitizedSku.replace(/[^a-zA-Z0-9\-_]/g, '');
        }
      });
      
      // PHASE 0: Variant Price Validation (7.5.2) - Warning if variant price > parent regularPrice * 2
      const parentRegularPrice = product.productDataMetaBox?.regularPrice || 0;
      if (parentRegularPrice > 0) {
        const highPriceVariants = variantsToUpdate
          .filter((v: any) => v.price !== undefined && v.price > parentRegularPrice * 2)
          .map((v: any) => ({ id: v.id, price: v.price }));
        
        // Log warning but don't block (business rule: warning only)
        if (highPriceVariants.length > 0) {
          console.warn('Variant price validation warning:', {
            productId: productId.toString(),
            parentRegularPrice,
            highPriceVariants,
            message: 'Some variant prices are more than 2x the parent regular price'
          });
        }
      }
      
      // Update variants (only fields that exist in MongoDB schema)
      // FIX: Normalize variant IDs before comparison to handle string/ObjectId mismatches
      const updatedVariants = currentVariants.map((variant: any) => {
        // Normalize variant ID: convert to string and trim whitespace
        const variantId = String(variant.id || '').trim();
        const updateVariant = variantsToUpdate.find((v: any) => {
          const updateId = String(v.id || '').trim();
          return updateId === variantId;
        });
        if (updateVariant) {
          const updatedVariant = {
            ...variant,
            ...(updateVariant.sku !== undefined && { sku: updateVariant.sku }),
            ...(updateVariant.stock !== undefined && { stock: updateVariant.stock }),
            // NOTE: stockStatus removed - variants don't have this field
            // Variants inherit stockStatus from parent product
          };
          
          // FIX: Always update price if provided (even if 0)
          // Don't use conditional spread for price - it should always be updated if provided
          if (updateVariant.price !== undefined) {
            updatedVariant.price = updateVariant.price;
          }
          
          return updatedVariant;
        }
        return variant;
      });
      updateData.variants = updatedVariants;
      
      // PHASE 0: Variants Structure Sync (7.1.3) - Sync variations[] from variants[]
      // Ensure productDataMetaBox.variations[] is synced from variants[] for backward compatibility
      // NOTE: variations[] is deprecated but kept for backward compatibility
      // PHASE 1: Use helper function for consistent pattern (7.2.3)
      const metaBox = ensureProductDataMetaBox(updateData, product);
      
      // Convert variants[] back to variations[] format (for backward compatibility)
      // This ensures consistency between variants[] and variations[]
      updateData.productDataMetaBox.variations = updatedVariants.map((variant: any) => {
        const attributes: Record<string, string> = {};
        if (variant.size) attributes.Size = variant.size;
        if (variant.color) attributes.Color = variant.color;
        
        return {
          id: variant.id,
          attributes,
          regularPrice: variant.price,
          salePrice: undefined, // Quick Edit doesn't support variant salePrice yet
          stockQuantity: variant.stock || 0,
          sku: variant.sku,
          image: variant.image,
        };
      });
      
      // PHASE 0: Bounds Recalculation (7.1.4) - Calculate from updated variants
      const variantPrices = updatedVariants
        .map((v: any) => Number(v.price) || 0)
        .filter((price: number) => price > 0);
      
      if (variantPrices.length > 0) {
        updateData.minPrice = Math.min(...variantPrices);
        updateData.maxPrice = Math.max(...variantPrices);
      }
      
      updateData.totalStock = updatedVariants.reduce(
        (sum: number, v: any) => sum + (Number(v.stock) || 0),
        0
      );
    }
    
    // PHASE 1: Categories & Tags Update (7.2.1)
    if (validatedData.categories !== undefined) {
      // Validate categories exist
      const { categories } = await getCollections();
      const categoryIds = validatedData.categories.filter(Boolean);
      
      if (categoryIds.length > 0) {
        // Validate all category IDs exist
        const validCategoryIds = categoryIds.filter((id: string) => ObjectId.isValid(id));
        const categoryDocs = await categories.find({
          _id: { $in: validCategoryIds.map((id: string) => new ObjectId(id)) },
          deletedAt: null, // Only active categories
        }).toArray();
        
        if (categoryDocs.length !== validCategoryIds.length) {
          return NextResponse.json(
            { 
              error: 'Một hoặc nhiều danh mục không tồn tại hoặc đã bị xóa',
              details: `Found ${categoryDocs.length} valid categories out of ${validCategoryIds.length} provided`
            },
            { status: 400 }
          );
        }
        
        // Set categories array (new structure)
        updateData.categories = validCategoryIds;
        // Also set categoryId for backward compatibility (first category as primary)
        if (validCategoryIds.length > 0) {
          updateData.categoryId = validCategoryIds[0];
        }
        // Clear legacy category field if exists
        delete updateData.category;
      } else {
        // Empty array - clear categories
        updateData.categories = [];
        updateData.categoryId = undefined;
        delete updateData.category;
      }
    }
    
    if (validatedData.tags !== undefined) {
      // Tags are just strings, no validation needed
      updateData.tags = validatedData.tags.filter((tag: string) => tag && tag.trim().length > 0);
    }
    
    // PHASE 1: Weight & Dimensions Update (4.1.3)
    if (validatedData.weight !== undefined || validatedData.length !== undefined || 
        validatedData.width !== undefined || validatedData.height !== undefined) {
      // Update weight (can be in both top-level and productDataMetaBox)
      const metaBox = ensureProductDataMetaBox(updateData, product);
      if (validatedData.weight !== undefined) {
        updateData.weight = validatedData.weight;
        metaBox.weight = validatedData.weight;
      }
      
      // Update dimensions
      if (validatedData.length !== undefined) {
        updateData.length = validatedData.length;
        metaBox.length = validatedData.length;
      }
      
      if (validatedData.width !== undefined) {
        updateData.width = validatedData.width;
        metaBox.width = validatedData.width;
      }
      
      if (validatedData.height !== undefined) {
        updateData.height = validatedData.height;
        metaBox.height = validatedData.height;
      }
      
      // Auto-calculate volumetric weight: (L * W * H) / 6000
      const effectiveLength = validatedData.length ?? product.length ?? product.productDataMetaBox?.length ?? 0;
      const effectiveWidth = validatedData.width ?? product.width ?? product.productDataMetaBox?.width ?? 0;
      const effectiveHeight = validatedData.height ?? product.height ?? product.productDataMetaBox?.height ?? 0;
      
      if (effectiveLength > 0 && effectiveWidth > 0 && effectiveHeight > 0) {
        const volumetricWeight = (effectiveLength * effectiveWidth * effectiveHeight) / 6000;
        updateData.volumetricWeight = volumetricWeight;
      }
    }
    
    // PHASE 1: Low Stock Threshold Update (4.1.4)
    if (validatedData.lowStockThreshold !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      metaBox.lowStockThreshold = validatedData.lowStockThreshold;
    }
    
    // PHASE 2: SEO Fields Update (4.2.1)
    if (validatedData.seoTitle !== undefined || validatedData.seoDescription !== undefined || validatedData.slug !== undefined) {
      // Initialize seo object if it doesn't exist
      if (!updateData.seo) {
        updateData.seo = { ...product.seo || {} };
      }
      
      if (validatedData.seoTitle !== undefined) {
        updateData.seo.seoTitle = validatedData.seoTitle || undefined;
      }
      
      if (validatedData.seoDescription !== undefined) {
        updateData.seo.seoDescription = validatedData.seoDescription || undefined;
      }
      
      if (validatedData.slug !== undefined) {
        // Validate slug uniqueness (if changed)
        if (validatedData.slug !== product.slug) {
          const { products } = await getCollections();
          const existingProduct = await products.findOne({ 
            slug: validatedData.slug,
            _id: { $ne: new ObjectId(params.id) } // Exclude current product
          });
          
          if (existingProduct) {
            return NextResponse.json(
              { error: 'URL Slug đã được sử dụng bởi sản phẩm khác' },
              { status: 409 }
            );
          }
        }
        updateData.slug = validatedData.slug;
      }
    }
    
    // PHASE 2: Cost Price Update (4.2.2)
    if (validatedData.costPrice !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      metaBox.costPrice = validatedData.costPrice || undefined;
    }
    
    // PHASE 2: Product Type & Visibility Update (4.2.3)
    if (validatedData.productType !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      const oldProductType = product.productDataMetaBox?.productType || 'simple';
      const newProductType = validatedData.productType;
      
      // Warning: Changing from variable to simple/grouped/external will lose variants
      // This is handled in frontend with confirmation dialog, but we validate here too
      if (oldProductType === 'variable' && newProductType !== 'variable') {
        // Check if product has variants
        const hasVariants = product.variants && product.variants.length > 0;
        if (hasVariants) {
          // Don't block, but log warning - frontend should have already confirmed
          console.warn(`[Quick Update] Product type changed from 'variable' to '${newProductType}' - variants may be lost`);
        }
      }
      
      metaBox.productType = newProductType;
    }
    
    if (validatedData.visibility !== undefined) {
      updateData.visibility = validatedData.visibility;
      
      // Clear password if visibility is not 'password'
      if (validatedData.visibility !== 'password') {
        updateData.password = undefined;
      }
    }
    
    if (validatedData.password !== undefined) {
      // Only set password if visibility is 'password'
      if (validatedData.visibility === 'password' || product.visibility === 'password') {
        updateData.password = validatedData.password || undefined;
      } else if (validatedData.password) {
        // Password provided but visibility is not 'password' - ignore password
        console.warn('[Quick Update] Password provided but visibility is not "password" - ignoring password');
      }
    }
    
    // PHASE 2: Shipping Class & Tax Settings Update (4.2.4)
    if (validatedData.shippingClass !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      // Convert '__none__' to undefined (Radix UI uses '__none__' for empty value)
      metaBox.shippingClass = validatedData.shippingClass === '__none__' || validatedData.shippingClass === '' 
        ? undefined 
        : validatedData.shippingClass;
    }
    
    if (validatedData.taxStatus !== undefined || validatedData.taxClass !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      if (validatedData.taxStatus !== undefined) {
        metaBox.taxStatus = validatedData.taxStatus;
      }
      if (validatedData.taxClass !== undefined) {
        // Convert '__none__' to undefined (Radix UI uses '__none__' for empty value)
        metaBox.taxClass = validatedData.taxClass === '__none__' || validatedData.taxClass === '' 
          ? undefined 
          : validatedData.taxClass;
      }
    }
    
    // PHASE 3: Barcode/GTIN/EAN Update (4.3.1)
    if (validatedData.barcode !== undefined || validatedData.gtin !== undefined || validatedData.ean !== undefined) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      // Strip HTML tags and trim for all barcode fields
      if (validatedData.barcode !== undefined) {
        metaBox.barcode = validatedData.barcode ? stripHtmlTags(validatedData.barcode).trim() : undefined;
      }
      if (validatedData.gtin !== undefined) {
        metaBox.gtin = validatedData.gtin ? stripHtmlTags(validatedData.gtin).trim() : undefined;
      }
      if (validatedData.ean !== undefined) {
        metaBox.ean = validatedData.ean ? stripHtmlTags(validatedData.ean).trim() : undefined;
      }
    }
    
    // PHASE 3: Product Options Update - Attributes Enable/Disable (4.3.2)
    if (validatedData.attributes !== undefined && Array.isArray(validatedData.attributes)) {
      const metaBox = ensureProductDataMetaBox(updateData, product);
      const currentAttributes = product.productDataMetaBox?.attributes || [];
      const variants = product.variants || [];
      
      // Create a map of attribute names to their visibility updates
      const attributeVisibilityMap = new Map<string, boolean>();
      validatedData.attributes.forEach(attr => {
        if (attr.name && attr.visible !== undefined) {
          attributeVisibilityMap.set(attr.name, attr.visible);
        }
      });
      
      // Update attributes array with new visibility flags
      const updatedAttributes = currentAttributes.map((attr: any) => {
        const visibilityUpdate = attributeVisibilityMap.get(attr.name);
        if (visibilityUpdate !== undefined) {
          // Check if disabling an attribute that has active variants
          if (!visibilityUpdate && attr.variation && variants.length > 0) {
            // Check if any variant uses this attribute
            const hasActiveVariants = variants.some((variant: any) => {
              // Check if variant has this attribute value (for Size/Color, check direct fields)
              if (attr.name.toLowerCase() === 'size' && variant.size) {
                return true;
              }
              if (attr.name.toLowerCase() === 'color' && variant.color) {
                return true;
              }
              return false;
            });
            
            if (hasActiveVariants) {
              // Log warning but don't block - frontend should have already shown warning
              console.warn(`[Quick Update] Attribute "${attr.name}" is being disabled but has active variants`);
            }
          }
          
          return {
            ...attr,
            visible: visibilityUpdate,
          };
        }
        return attr;
      });
      
      metaBox.attributes = updatedAttributes;
    }
    
    // PHASE 1: Featured Image & Gallery Update (4.1.2) + Images Structure Sync (7.1.2)
    if (validatedData._thumbnail_id !== undefined || validatedData._product_image_gallery !== undefined) {
      // Update _thumbnail_id and _product_image_gallery
      if (validatedData._thumbnail_id !== undefined) {
        updateData._thumbnail_id = validatedData._thumbnail_id || null;
      }
      if (validatedData._product_image_gallery !== undefined) {
        updateData._product_image_gallery = validatedData._product_image_gallery || null;
      }
      
      // PHASE 1: Images Structure Sync (7.1.2) - Sync images array for backward compatibility
      const imagesArray: string[] = [];
      
      // Get effective thumbnail ID (from update or existing)
      const thumbnailId = validatedData._thumbnail_id !== undefined 
        ? validatedData._thumbnail_id 
        : product._thumbnail_id;
      
      // Get effective gallery IDs (from update or existing)
      const galleryIdsString = validatedData._product_image_gallery !== undefined
        ? validatedData._product_image_gallery
        : product._product_image_gallery;
      
      // Fetch media URLs if IDs are provided
      const { media } = await getCollections();
      const mediaIdsToFetch: string[] = [];
      
      if (thumbnailId) {
        mediaIdsToFetch.push(thumbnailId);
      }
      
      if (galleryIdsString) {
        const galleryIds = galleryIdsString.split(',').filter(Boolean).map((id: string) => id.trim());
        mediaIdsToFetch.push(...galleryIds);
      }
      
      // Fetch media documents to get URLs
      const mediaDocs = mediaIdsToFetch.length > 0
        ? await media.find({
            _id: { $in: mediaIdsToFetch.map((id: string) => {
              // Handle both ObjectId strings and URLs
              if (id.startsWith('http://') || id.startsWith('https://')) {
                return null; // Skip URLs, they're already URLs
              }
              try {
                return new ObjectId(id);
              } catch {
                return null; // Skip invalid IDs
              }
            }).filter((id): id is ObjectId => id !== null) },
          }).toArray()
        : [];
      
      // Create a map of media ID to URL
      const mediaUrlMap = new Map<string, string>();
      mediaDocs.forEach((doc: any) => {
        mediaUrlMap.set(doc._id.toString(), doc.url);
      });
      
      // Build images array: featured image first, then gallery images
      if (thumbnailId) {
        if (thumbnailId.startsWith('http://') || thumbnailId.startsWith('https://')) {
          // Already a URL
          imagesArray.push(thumbnailId);
        } else {
          // Look up URL from media collection
          const thumbnailUrl = mediaUrlMap.get(thumbnailId);
          if (thumbnailUrl) {
            imagesArray.push(thumbnailUrl);
          } else if (product.images && product.images.length > 0) {
            // Fallback: Keep existing featured image URL
            imagesArray.push(product.images[0]);
          }
        }
      } else if (product.images && product.images.length > 0) {
        // Keep existing featured image if _thumbnail_id is cleared
        // (But only if we're not clearing it explicitly)
        if (validatedData._thumbnail_id === null) {
          // Explicitly cleared - don't keep existing
        } else {
          // Not provided in update - keep existing
          imagesArray.push(product.images[0]);
        }
      }
      
      // Add gallery images
      if (galleryIdsString) {
        const galleryIds = galleryIdsString.split(',').filter(Boolean).map((id: string) => id.trim());
        galleryIds.forEach((imageId: string) => {
          if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
            // Already a URL
            imagesArray.push(imageId);
          } else {
            // Look up URL from media collection
            const galleryUrl = mediaUrlMap.get(imageId);
            if (galleryUrl) {
              imagesArray.push(galleryUrl);
            } else if (product.images && product.images.length > imagesArray.length) {
              // Fallback: Keep existing gallery image URL at corresponding position
              const existingIndex = imagesArray.length; // After featured image
              if (product.images[existingIndex]) {
                imagesArray.push(product.images[existingIndex]);
              }
            }
          }
        });
      } else if (validatedData._product_image_gallery === null) {
        // Explicitly cleared - don't add gallery images
      } else if (product.images && product.images.length > 1) {
        // Not provided in update - keep existing gallery images
        imagesArray.push(...product.images.slice(1));
      }
      
      // Update images array (even if empty, to clear it when both are cleared)
      if (validatedData._thumbnail_id === null && validatedData._product_image_gallery === null) {
        // Both explicitly cleared - clear images array
        updateData.images = [];
      } else if (imagesArray.length > 0) {
        // Update with new URLs
        updateData.images = imagesArray;
      }
      // If imagesArray is empty but we're not explicitly clearing, don't update images
      // (Keep existing images array)
    }
    
    // Increment version for optimistic locking
    incFields.version = 1;
    
    // ✅ CRITICAL FIX: Remove version from updateData to prevent MongoDB conflict
    // Version will be incremented using $inc, not $set
    delete updateData.version;
    
    // Build final update operation combining $set, $unset, and $inc
    const finalUpdateOperation: Record<string, unknown> = {};
    
    // Add $set operations (all fields in updateData)
    if (Object.keys(updateData).length > 0) {
      finalUpdateOperation.$set = updateData;
    }
    
    // Add $unset operations (sale dates cleanup)
    if (Object.keys(unsetFields).length > 0) {
      finalUpdateOperation.$unset = unsetFields;
    }
    
    // Add $inc operations (version increment)
    if (Object.keys(incFields).length > 0) {
      finalUpdateOperation.$inc = incFields;
    }
    
    // BUSINESS LOGIC FIX: Optimistic Locking - Thêm version vào filter
    const updateFilter: any = { _id: productId };
    if (validatedData.version !== undefined) {
      updateFilter.version = validatedData.version;
    }
    
    // PHASE 4: MongoDB Transactions (7.12.6) - Wrap update and audit log in transaction
    // Fix: Use proper AdminUser type - _id is ObjectId, convert to string
    const adminId = req.adminUser?._id?.toString() || '';
    
    // Fix: Convert Date to string for audit log (sale dates)
    const salePriceStartDate = product.productDataMetaBox?.salePriceStartDate
      ? (product.productDataMetaBox.salePriceStartDate instanceof Date
          ? product.productDataMetaBox.salePriceStartDate.toISOString()
          : String(product.productDataMetaBox.salePriceStartDate))
      : undefined;
    const salePriceEndDate = product.productDataMetaBox?.salePriceEndDate
      ? (product.productDataMetaBox.salePriceEndDate instanceof Date
          ? product.productDataMetaBox.salePriceEndDate.toISOString()
          : String(product.productDataMetaBox.salePriceEndDate))
      : undefined;
    
    // Prepare audit log data (before transaction)
    const auditLogData = {
      admin_id: adminId,
      action: 'PRODUCT_QUICK_UPDATE' as const,
      target_collection: 'products',
      target_id: productId.toString(),
      details: {
        oldValues: {
          name: product.name,
          sku: product.sku,
          status: product.status,
          regularPrice: product.productDataMetaBox?.regularPrice,
          salePrice: product.productDataMetaBox?.salePrice,
          salePriceStartDate,
          salePriceEndDate,
          stockQuantity: product.productDataMetaBox?.stockQuantity,
          stockStatus: product.productDataMetaBox?.stockStatus,
        },
        changes: validatedData,
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    };
    
    // Execute update and audit log creation within transaction
    let updatedProduct: any;
    try {
      updatedProduct = await withTransaction(async (session: ClientSession) => {
        const collections = await getCollectionsWithSession(session);
        const { products: productsCollection, adminActivityLogs } = collections;
        
        // Execute update with session
        const updateResult = await productsCollection.updateOne(
          updateFilter,
          finalUpdateOperation,
          { session }
        );
        
        // BUSINESS LOGIC FIX: Kiểm tra modifiedCount để phát hiện version conflict
        if (updateResult.modifiedCount === 0 && validatedData.version !== undefined) {
          // Không có document nào được update - có thể do version mismatch
          const currentProduct = await productsCollection.findOne({ _id: productId }, { session });
          if (currentProduct && currentProduct.version !== validatedData.version) {
            throw new Error('VERSION_MISMATCH');
          }
        }
        
        // PHASE 3: Audit Log Filtering (7.12.8) - Filter sensitive fields before logging
        const { filterSensitiveFields } = await import('@/lib/utils/auditLogger');
        const filteredDetails = {
          oldValues: auditLogData.details.oldValues ? filterSensitiveFields(auditLogData.details.oldValues) : undefined,
          changes: auditLogData.details.changes ? filterSensitiveFields(auditLogData.details.changes) : undefined,
        };
        
        // Create audit log within transaction
        await adminActivityLogs.insertOne({
          admin_id: new ObjectId(auditLogData.admin_id),
          action: auditLogData.action,
          target_collection: auditLogData.target_collection,
          target_id: new ObjectId(auditLogData.target_id),
          details: filteredDetails,
          ip_address: auditLogData.ip_address,
          user_agent: auditLogData.user_agent,
          createdAt: new Date(),
        }, { session });
    
        // Fetch updated product within transaction
        const result = await productsCollection.findOne({ _id: productId }, { session });
        if (!result) {
          throw new Error('Failed to fetch updated product');
        }
        
        return result;
      });
    } catch (error) {
      // Handle VERSION_MISMATCH error
      if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
        const { products: productsCollection } = await getCollections();
        const currentProduct = await productsCollection.findOne({ _id: productId });
        return NextResponse.json(
          { 
            error: 'Dữ liệu đã được cập nhật bởi một Admin khác, vui lòng tải lại trang',
            code: 'VERSION_MISMATCH',
            currentVersion: currentProduct?.version || 0,
          },
          { status: 409 }
        );
      }
      // Re-throw other errors to be handled by outer catch block
      throw error;
    }
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
    
    // FIX: Populate categories before mapping
    let populatedCategories: Array<{ id: string | number; name: string; slug: string }> = [];
    if (updatedProduct.category || updatedProduct.categoryId || (updatedProduct.categories && updatedProduct.categories.length > 0)) {
      const { categories } = await getCollections();
      const categoryIds = updatedProduct.categories && updatedProduct.categories.length > 0 
        ? updatedProduct.categories 
        : (updatedProduct.categoryId ? [updatedProduct.categoryId] : (updatedProduct.category ? [updatedProduct.category] : []));
      
      // Fetch all category documents
      const categoryDocs = await categories.find({
        $or: [
          { _id: { $in: categoryIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id)) } },
          { slug: { $in: categoryIds.filter((id: string) => !ObjectId.isValid(id)) } },
        ],
      }).toArray();
      
      // Map to frontend format (use string ID instead of parseInt)
      populatedCategories = categoryDocs.map((cat: any) => ({
        id: cat._id.toString(), // Use ObjectId string directly
        name: cat.name,
        slug: cat.slug,
      }));
    }
    
    const mappedProduct = mapMongoProduct(updatedProduct as unknown as MongoProduct, populatedCategories);
    
    return NextResponse.json({
      success: true,
      product: mappedProduct,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    // PHASE 1: Error Message Sanitization (7.12.4) - Generic messages in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log detailed error to server logs (always)
    console.error('[Admin Product Quick Update API] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Determine error code and message
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'Đã xảy ra lỗi khi cập nhật sản phẩm';
    
    if (error instanceof z.ZodError) {
      errorCode = 'VALIDATION_ERROR';
      errorMessage = 'Dữ liệu không hợp lệ';
    } else if (error instanceof Error) {
      // Use generic messages in production, detailed in development
      if (isDevelopment) {
        errorMessage = error.message || 'Failed to quick update product';
      } else {
        // Generic messages for common errors
        if (error.message.includes('not found')) {
          errorCode = 'PRODUCT_NOT_FOUND';
          errorMessage = 'Không tìm thấy sản phẩm';
        } else if (error.message.includes('VERSION_MISMATCH')) {
          errorCode = 'VERSION_MISMATCH';
          errorMessage = 'Sản phẩm đã được cập nhật bởi người khác. Vui lòng làm mới và thử lại.';
        } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
          errorCode = 'UNAUTHORIZED';
          errorMessage = 'Bạn không có quyền thực hiện thao tác này';
        } else {
          errorMessage = 'Đã xảy ra lỗi khi cập nhật sản phẩm';
        }
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode,
        // Only include details in development
        details: isDevelopment && error instanceof Error
          ? { 
              stack: error.stack,
              name: error.name,
              originalMessage: error.message,
            }
          : undefined,
      },
      { 
        status: errorCode === 'VALIDATION_ERROR' ? 400 : 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    }
  }, 'product:update');
  });
}

