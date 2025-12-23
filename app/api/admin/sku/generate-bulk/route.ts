/**
 * Smart SKU Bulk Generation API
 * POST /api/admin/sku/generate-bulk
 * 
 * Generate SKUs for multiple products (e.g., Excel import)
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
const bulkGenerateSkuSchema = z.object({
  products: z
    .array(
      z.object({
        productName: z.string().min(1),
        categoryId: z.string().optional(),
        brandId: z.string().optional(),
        variants: z
          .array(
            z.object({
              attributes: z.array(
                z.object({
                  key: z.string(),
                  value: z.string(),
                })
              ),
            })
          )
          .optional(),
      })
    )
    .min(1, 'Cần ít nhất 1 sản phẩm'),
});

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validated = bulkGenerateSkuSchema.parse(body);

      const results: Array<{
        productIndex: number;
        productSku?: string;
        variantSkus?: Array<{
          variantIndex: number;
          sku: string;
        }>;
        error?: string;
      }> = [];

      // Process each product
      for (let i = 0; i < validated.products.length; i++) {
        const product = validated.products[i];

        try {
          // Get SKU pattern
          const skuSetting = await getSkuPattern(product.categoryId || null);

          // Build context
          const context: SkuContext = {
            productName: product.productName,
            year: new Date().getFullYear(),
          };

          // Get category code
          if (product.categoryId) {
            try {
              context.categoryCode = await getCategoryCode(product.categoryId);
            } catch (error: any) {
              results.push({
                productIndex: i,
                error: `Danh mục không tồn tại: ${error.message}`,
              });
              continue;
            }
          }

          // Generate product SKU
          const productSku = await generateSku(
            skuSetting.pattern,
            context,
            skuSetting.separator,
            skuSetting.caseType,
            undefined,
            false,
            false
          );

          // Generate variant SKUs if provided
          const variantSkus: Array<{ variantIndex: number; sku: string }> = [];

          if (product.variants && product.variants.length > 0) {
            for (let j = 0; j < product.variants.length; j++) {
              const variant = product.variants[j];

              try {
                const variantContext: SkuContext = {
                  ...context,
                  attributes: variant.attributes as AttributePair[],
                };

                const variantSku = await generateSku(
                  skuSetting.pattern,
                  variantContext,
                  skuSetting.separator,
                  skuSetting.caseType,
                  undefined,
                  true, // isVariant
                  false
                );

                variantSkus.push({
                  variantIndex: j,
                  sku: variantSku,
                });
              } catch (error: any) {
                variantSkus.push({
                  variantIndex: j,
                  sku: '', // Error case
                });
              }
            }
          }

          results.push({
            productIndex: i,
            productSku: productSku,
            variantSkus: variantSkus.length > 0 ? variantSkus : undefined,
          });
        } catch (error: any) {
          results.push({
            productIndex: i,
            error: error.message || 'Lỗi không xác định',
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          results: results,
          total: validated.products.length,
          success: results.filter((r) => !r.error).length,
          failed: results.filter((r) => r.error).length,
        },
      });
    } catch (error: any) {
      console.error('[SKU Bulk Generate] Error:', error);

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

      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi sinh SKU hàng loạt. Vui lòng thử lại.',
        },
        { status: 500 }
      );
    }
  });
}

