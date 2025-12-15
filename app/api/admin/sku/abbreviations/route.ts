/**
 * SKU Abbreviation Dictionary Management API
 * GET /api/admin/sku/abbreviations - List abbreviations
 * POST /api/admin/sku/abbreviations - Create abbreviation
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import type { SkuAbbreviation } from '@/types/mongodb';

export const dynamic = 'force-dynamic';

// Request body schema for POST
const abbreviationSchema = z.object({
  type: z.enum(['ATTRIBUTE'], {
    errorMap: () => ({ message: 'Type phải là ATTRIBUTE' }),
  }),
  originalValue: z.string().min(1, 'Giá trị gốc là bắt buộc'),
  shortCode: z
    .string()
    .min(1, 'Mã viết tắt là bắt buộc')
    .max(10, 'Mã viết tắt tối đa 10 ký tự')
    .transform((val) => val.toUpperCase()), // Auto uppercase
  categoryId: z.string().nullable().optional(), // Optional: category-specific mapping
});

/**
 * GET /api/admin/sku/abbreviations
 * List abbreviations with filters
 * Query params: type, categoryId, search
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const collections = await getCollections();
      const searchParams = request.nextUrl.searchParams;

      const type = searchParams.get('type') as 'ATTRIBUTE' | null;
      const categoryId = searchParams.get('categoryId');
      const search = searchParams.get('search');

      // Build query
      const query: any = {};

      if (type) {
        query.type = type;
      }

      if (categoryId) {
        query.categoryId = new ObjectId(categoryId);
      } else if (categoryId === null || searchParams.has('categoryId')) {
        // Explicitly filter for null categoryId (global abbreviations)
        query.categoryId = null;
      }

      if (search) {
        query.$or = [
          { originalValue: { $regex: search, $options: 'i' } },
          { shortCode: { $regex: search, $options: 'i' } },
        ];
      }

      const abbreviations = await collections.skuAbbreviations
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({
        success: true,
        data: abbreviations,
        total: abbreviations.length,
      });
    } catch (error: any) {
      console.error('[SKU Abbreviations GET] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi lấy danh sách viết tắt.',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/sku/abbreviations
 * Create new abbreviation
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validated = abbreviationSchema.parse(body);

      const collections = await getCollections();

      // Check for duplicate
      const duplicateQuery: any = {
        type: validated.type,
        originalValue: validated.originalValue.trim(),
      };

      if (validated.categoryId) {
        duplicateQuery.categoryId = new ObjectId(validated.categoryId);
      } else {
        duplicateQuery.categoryId = null;
      }

      const existing = await collections.skuAbbreviations.findOne(duplicateQuery);

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            code: 'DUPLICATE_ABBREVIATION',
            message: 'Đã tồn tại viết tắt cho giá trị này',
          },
          { status: 409 }
        );
      }

      // Create new abbreviation
      const now = new Date();
      const newAbbreviation: Omit<SkuAbbreviation, '_id'> = {
        type: validated.type,
        originalValue: validated.originalValue.trim(),
        shortCode: validated.shortCode,
        categoryId: validated.categoryId
          ? (new ObjectId(validated.categoryId) as any)
          : null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collections.skuAbbreviations.insertOne(newAbbreviation as any);

      const created = await collections.skuAbbreviations.findOne({
        _id: result.insertedId,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Viết tắt đã được tạo',
          data: created,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('[SKU Abbreviations POST] Error:', error);

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
          message: 'Đã xảy ra lỗi khi tạo viết tắt.',
        },
        { status: 500 }
      );
    }
  });
}

