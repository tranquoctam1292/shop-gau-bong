/**
 * SKU Abbreviation Management API (Single)
 * PUT /api/admin/sku/abbreviations/[id] - Update abbreviation
 * DELETE /api/admin/sku/abbreviations/[id] - Delete abbreviation
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Request body schema for PUT
const updateAbbreviationSchema = z.object({
  originalValue: z.string().min(1, 'Giá trị gốc là bắt buộc').optional(),
  shortCode: z
    .string()
    .min(1, 'Mã viết tắt là bắt buộc')
    .max(10, 'Mã viết tắt tối đa 10 ký tự')
    .transform((val) => val.toUpperCase())
    .optional(),
  categoryId: z.string().nullable().optional(),
});

/**
 * PUT /api/admin/sku/abbreviations/[id]
 * Update abbreviation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const collections = await getCollections();
      const body = await request.json();
      const validated = updateAbbreviationSchema.parse(body);

      const abbreviationId = params.id;

      // Check if abbreviation exists
      const existing = await collections.skuAbbreviations.findOne({
        _id: new ObjectId(abbreviationId),
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            code: 'ABBREVIATION_NOT_FOUND',
            message: 'Không tìm thấy viết tắt',
          },
          { status: 404 }
        );
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validated.originalValue !== undefined) {
        updateData.originalValue = validated.originalValue.trim();
      }

      if (validated.shortCode !== undefined) {
        updateData.shortCode = validated.shortCode;
      }

      if (validated.categoryId !== undefined) {
        updateData.categoryId = validated.categoryId
          ? new ObjectId(validated.categoryId)
          : null;
      }

      // Update abbreviation
      const updated = await collections.skuAbbreviations.findOneAndUpdate(
        { _id: new ObjectId(abbreviationId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      return NextResponse.json({
        success: true,
        message: 'Viết tắt đã được cập nhật',
        data: updated,
      });
    } catch (error: any) {
      console.error('[SKU Abbreviations PUT] Error:', error);

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

      // Invalid ObjectId
      if (error.message?.includes('ObjectId')) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_ID',
            message: 'ID không hợp lệ',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi cập nhật viết tắt.',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/admin/sku/abbreviations/[id]
 * Delete abbreviation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const collections = await getCollections();
      const abbreviationId = params.id;

      const result = await collections.skuAbbreviations.deleteOne({
        _id: new ObjectId(abbreviationId),
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          {
            success: false,
            code: 'ABBREVIATION_NOT_FOUND',
            message: 'Không tìm thấy viết tắt',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Viết tắt đã được xóa',
      });
    } catch (error: any) {
      console.error('[SKU Abbreviations DELETE] Error:', error);

      // Invalid ObjectId
      if (error.message?.includes('ObjectId')) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_ID',
            message: 'ID không hợp lệ',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi xóa viết tắt.',
        },
        { status: 500 }
      );
    }
  });
}

