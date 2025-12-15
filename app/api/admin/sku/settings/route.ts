/**
 * SKU Settings Management API
 * GET /api/admin/sku/settings - Get all settings (global + category-specific)
 * POST /api/admin/sku/settings - Create/Update setting
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import type { SkuSetting } from '@/types/mongodb';

export const dynamic = 'force-dynamic';

// Request body schema for POST
const skuSettingSchema = z.object({
  categoryId: z.string().nullable().optional(), // null = global, string = category-specific
  pattern: z.string().min(1, 'Pattern là bắt buộc'),
  separator: z.string().length(1, 'Separator phải là 1 ký tự').optional().default('-'),
  caseType: z.enum(['UPPER', 'LOWER']).optional().default('UPPER'),
});

/**
 * GET /api/admin/sku/settings
 * Get all SKU settings (global + category-specific)
 * Query params: categoryId (optional) - Get setting for specific category
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const collections = await getCollections();
      const searchParams = request.nextUrl.searchParams;
      const categoryId = searchParams.get('categoryId');

      if (categoryId) {
        // Get setting for specific category
        const setting = await collections.skuSettings.findOne({
          categoryId: categoryId,
        });

        if (!setting) {
          // Fallback to global
          const globalSetting = await collections.skuSettings.findOne({
            categoryId: null,
          });

          return NextResponse.json({
            success: true,
            data: globalSetting || null,
            isGlobal: !globalSetting,
          });
        }

        return NextResponse.json({
          success: true,
          data: setting,
          isGlobal: false,
        });
      }

      // Get all settings (global + category-specific)
      const [globalSetting, categorySettings] = await Promise.all([
        collections.skuSettings.findOne({ categoryId: null }),
        collections.skuSettings.find({ categoryId: { $ne: null } }).toArray(),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          global: globalSetting,
          categories: categorySettings,
        },
      });
    } catch (error: any) {
      console.error('[SKU Settings GET] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi lấy cài đặt SKU.',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/sku/settings
 * Create or update SKU setting
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validated = skuSettingSchema.parse(body);

      const collections = await getCollections();

      // Convert categoryId to ObjectId if provided (not null)
      const categoryId = validated.categoryId === null 
        ? null 
        : validated.categoryId 
        ? new ObjectId(validated.categoryId)
        : null;

      // Check if setting already exists
      const existing = await collections.skuSettings.findOne({
        categoryId: categoryId,
      });

      const now = new Date();

      if (existing) {
        // Update existing setting
        const updated = await collections.skuSettings.findOneAndUpdate(
          { categoryId: categoryId },
          {
            $set: {
              pattern: validated.pattern,
              separator: validated.separator,
              caseType: validated.caseType,
              updatedAt: now,
            },
          },
          { returnDocument: 'after' }
        );

        return NextResponse.json({
          success: true,
          message: 'Cài đặt SKU đã được cập nhật',
          data: updated,
        });
      } else {
        // Create new setting
        const newSetting: Omit<SkuSetting, '_id'> = {
          categoryId: categoryId as any,
          pattern: validated.pattern,
          separator: validated.separator,
          caseType: validated.caseType,
          createdAt: now,
          updatedAt: now,
        };

        const result = await collections.skuSettings.insertOne(newSetting as any);

        const created = await collections.skuSettings.findOne({
          _id: result.insertedId,
        });

        return NextResponse.json(
          {
            success: true,
            message: 'Cài đặt SKU đã được tạo',
            data: created,
          },
          { status: 201 }
        );
      }
    } catch (error: any) {
      console.error('[SKU Settings POST] Error:', error);

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

      // MongoDB duplicate key error
      if (error.code === 11000) {
        return NextResponse.json(
          {
            success: false,
            code: 'DUPLICATE_SETTING',
            message: 'Đã tồn tại cài đặt cho danh mục này',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi lưu cài đặt SKU.',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/admin/sku/settings?categoryId=xxx
 * Delete category-specific setting (cannot delete global)
 */
export async function DELETE(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const collections = await getCollections();
      const searchParams = request.nextUrl.searchParams;
      const categoryId = searchParams.get('categoryId');

      if (!categoryId) {
        return NextResponse.json(
          {
            success: false,
            code: 'CATEGORY_ID_REQUIRED',
            message: 'categoryId là bắt buộc để xóa cài đặt',
          },
          { status: 400 }
        );
      }

      // Cannot delete global setting (categoryId = null)
      if (categoryId === 'null' || categoryId === '') {
        return NextResponse.json(
          {
            success: false,
            code: 'CANNOT_DELETE_GLOBAL',
            message: 'Không thể xóa cài đặt toàn cục',
          },
          { status: 400 }
        );
      }

      const result = await collections.skuSettings.deleteOne({
        categoryId: new ObjectId(categoryId),
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          {
            success: false,
            code: 'SETTING_NOT_FOUND',
            message: 'Không tìm thấy cài đặt cho danh mục này',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Cài đặt đã được xóa',
      });
    } catch (error: any) {
      console.error('[SKU Settings DELETE] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi xóa cài đặt.',
        },
        { status: 500 }
      );
    }
  });
}

