/**
 * Schema for ProductQuickEditDialog
 * 
 * PHASE 0: Context API Setup - Extract schema for reuse
 */

import { z } from 'zod';

// Helper to convert NaN to undefined for optional number fields
export const nanToUndefined = z.preprocess((val) => {
  if (typeof val === 'number' && isNaN(val)) {
    return undefined;
  }
  return val;
}, z.number().optional());

// Form schema with NaN protection
export const quickEditSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  sku: z.string().optional(),
  status: z.enum(['draft', 'publish', 'trash']),
  manageStock: z.boolean(),
  regularPrice: z.preprocess((val) => {
    // Convert NaN to 0 for required field
    if (typeof val === 'number' && isNaN(val)) {
      return 0;
    }
    return val;
  }, z.number({ invalid_type_error: 'Giá phải là số hợp lệ' })
    .min(0, 'Giá phải >= 0')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'Giá không hợp lệ' })),
  salePrice: nanToUndefined
    .pipe(z.number({ invalid_type_error: 'Giá khuyến mãi phải là số hợp lệ' })
      .min(0, 'Giá khuyến mãi phải >= 0')
      .optional()
      .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), { message: 'Giá khuyến mãi không hợp lệ' })),
  stockQuantity: z.preprocess((val) => {
    // Convert NaN to 0 for required field
    if (typeof val === 'number' && isNaN(val)) {
      return 0;
    }
    return val;
  }, z.number({ invalid_type_error: 'Số lượng phải là số hợp lệ' })
    .min(0, 'Số lượng phải >= 0')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'Số lượng không hợp lệ' })),
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']),
  version: z.number().optional(),
  bulkUpdate: z.boolean().default(false),
  // PHASE 1: Weight & Dimensions (4.1.3)
  weight: nanToUndefined.pipe(z.number({ invalid_type_error: 'Trọng lượng phải là số hợp lệ' }).min(0, 'Trọng lượng phải >= 0').optional()),
  length: nanToUndefined.pipe(z.number({ invalid_type_error: 'Chiều dài phải là số hợp lệ' }).min(0, 'Chiều dài phải >= 0').optional()),
  width: nanToUndefined.pipe(z.number({ invalid_type_error: 'Chiều rộng phải là số hợp lệ' }).min(0, 'Chiều rộng phải >= 0').optional()),
  height: nanToUndefined.pipe(z.number({ invalid_type_error: 'Chiều cao phải là số hợp lệ' }).min(0, 'Chiều cao phải >= 0').optional()),
  // PHASE 1: Low Stock Threshold (4.1.4)
  lowStockThreshold: nanToUndefined.pipe(z.number({ invalid_type_error: 'Ngưỡng tồn kho thấp phải là số hợp lệ' }).int('Ngưỡng tồn kho thấp phải là số nguyên').nonnegative('Ngưỡng tồn kho thấp phải >= 0').optional()),
  // PHASE 1: Categories & Tags (4.1.1)
  categories: z.array(z.string()).optional(), // Array of category IDs
  tags: z.array(z.string()).optional(), // Array of tag strings
  // PHASE 1: Featured Image & Gallery (4.1.2)
  _thumbnail_id: z.string().optional(), // Featured image ID
  _product_image_gallery: z.string().optional(), // Comma-separated gallery image IDs
  // PHASE 2: SEO Fields (4.2.1)
  seoTitle: z.string().max(60, 'Meta Title không được vượt quá 60 ký tự').optional(),
  seoDescription: z.string().max(160, 'Meta Description không được vượt quá 160 ký tự').optional(),
  slug: z.string().min(1, 'URL Slug không được để trống').regex(/^[a-z0-9-]+$/, 'URL Slug chỉ được chứa chữ thường, số và dấu gạch ngang').optional(),
  // PHASE 2: Cost Price (4.2.2)
  costPrice: nanToUndefined.pipe(z.number({ invalid_type_error: 'Giá vốn phải là số hợp lệ' }).min(0, 'Giá vốn phải >= 0').optional()),
  // PHASE 2: Product Type & Visibility (4.2.3)
  productType: z.enum(['simple', 'variable', 'grouped', 'external']).optional(),
  visibility: z.enum(['public', 'private', 'password']).optional(),
  password: z.string().optional(),
  // PHASE 2: Shipping Class & Tax Settings (4.2.4)
  shippingClass: z.string().optional(),
  taxStatus: z.enum(['taxable', 'shipping', 'none']).optional(),
  taxClass: z.string().optional(),
  // PHASE 3: Barcode/GTIN/EAN (4.3.1)
  barcode: z.string().optional(),
  gtin: z.string().optional(),
  ean: z.string().optional(),
  // PHASE 3: Product Options (4.3.2) - Attributes enable/disable
  attributes: z.array(z.object({
    name: z.string(),
    visible: z.boolean().optional(),
  })).optional(),
  // PHASE 3: Sold Individually (4.3.3)
  soldIndividually: z.boolean().optional(),
  // PHASE 3: Backorders Settings (4.3.4)
  backorders: z.enum(['no', 'notify', 'yes']).optional(),
  variants: z.array(z.object({
    id: z.string(),
    sku: z.string().optional(),
    price: nanToUndefined
      .pipe(z.number({ invalid_type_error: 'Giá phải là số hợp lệ' })
        .min(0, 'Giá phải >= 0')
        .optional()
        .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), { message: 'Giá không hợp lệ' })),
    stock: nanToUndefined
      .pipe(z.number({ invalid_type_error: 'Số lượng phải là số hợp lệ' })
        .min(0, 'Số lượng phải >= 0')
        .optional()
        .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), { message: 'Số lượng không hợp lệ' })),
    // Display-only fields (not editable in form, but needed for VariantQuickEditTable)
    size: z.string().optional(),
    color: z.string().optional(),
    colorCode: z.string().optional(),
    image: z.string().optional(),
  })).optional(),
}).refine(
  (data) => {
    if (data.salePrice !== undefined && data.regularPrice !== undefined) {
      return data.salePrice < data.regularPrice;
    }
    return true;
  },
  { message: 'Giá khuyến mãi phải nhỏ hơn giá thường', path: ['salePrice'] }
);

