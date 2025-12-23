/**
 * Smart SKU Generation API
 * POST /api/admin/sku/generate
 * 
 * Generate SKU preview or actual SKU for product/variant
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import {
  generateSku,
  getSkuPattern,
  getCategoryCode,
  normalizeSku,
  type SkuContext,
  type AttributePair,
} from '@/lib/utils/skuGenerator';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Request body schema
const generateSkuSchema = z.object({
  productName: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  categoryId: z.string().optional(),
  brandId: z.string().optional(), // For {BRAND_CODE} token
  attributes: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  isVariant: z.boolean().optional().default(false),
  variantIndex: z.number().optional(),
  previewMode: z.boolean().optional().default(false), // If true, returns placeholder for {INCREMENT}
  excludeProductId: z.string().optional(), // For update case
});

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validated = generateSkuSchema.parse(body);

      // Get SKU pattern (category-specific or global)
      const skuSetting = await getSkuPattern(validated.categoryId || null);

      // Build context for SKU generation
      const context: SkuContext = {
        productName: validated.productName,
        year: new Date().getFullYear(),
      };

      // Get category code if categoryId provided
      if (validated.categoryId) {
        try {
          context.categoryCode = await getCategoryCode(validated.categoryId);
          context.categoryId = validated.categoryId; // Also store categoryId for abbreviation lookup
        } catch (error: any) {
          return NextResponse.json(
            {
              success: false,
              code: 'CATEGORY_NOT_FOUND',
              message: `Danh mục không tồn tại hoặc chưa có code: ${error.message}`,
            },
            { status: 400 }
          );
        }
      }

      // Get brand code if brandId provided (future feature)
      if (validated.brandId) {
        // TODO: Implement brand code lookup when brand field is added
        context.brandCode = undefined;
      }

      // Process attributes
      if (validated.attributes && validated.attributes.length > 0) {
        context.attributes = validated.attributes as AttributePair[];
      }

      // Generate SKU
      const sku = await generateSku(
        skuSetting.pattern,
        context,
        skuSetting.separator,
        skuSetting.caseType,
        validated.excludeProductId,
        validated.isVariant,
        validated.previewMode || false
      );

      // Normalize SKU for duplicate checking (only if not preview mode)
      const skuNormalized = validated.previewMode ? undefined : normalizeSku(sku);

      return NextResponse.json({
        success: true,
        data: {
          sku: sku,
          sku_normalized: skuNormalized,
          hasIncrementToken: skuSetting.pattern.includes('{INCREMENT}'),
          preview: validated.previewMode
            ? 'Số thứ tự thực tế sẽ được gán khi lưu sản phẩm để đảm bảo không trùng lặp.'
            : undefined,
        },
      });
    } catch (error: any) {
      console.error('[SKU Generate] Error:', error);

      // Zod validation error
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            errors: error.errors,
          },
          { status: 400 }
        );
      }

      // Custom error messages
      if (error.message.includes('Category not found')) {
        return NextResponse.json(
          {
            success: false,
            code: 'CATEGORY_NOT_FOUND',
            message: error.message,
          },
          { status: 400 }
        );
      }

      if (error.message.includes('Failed to generate unique SKU')) {
        return NextResponse.json(
          {
            success: false,
            code: 'SKU_GENERATION_FAILED',
            message: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi sinh SKU. Vui lòng thử lại.',
        },
        { status: 500 }
      );
    }
  });
}

