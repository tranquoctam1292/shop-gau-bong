/**
 * Categories SEO API
 *
 * GET /api/admin/seo/categories - Get categories with SEO data
 * PATCH /api/admin/seo/categories - Bulk update categories SEO
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getCollections } from '@/lib/db';
import { AdminRole } from '@/types/admin';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// Types
interface CategorySEOItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  seo: {
    metaTitle?: string;
    metaDesc?: string;
  };
  productCount: number;
  status: string;
  updatedAt: Date;
}

// Validation schema for bulk update
const BulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      categoryId: z.string().min(1),
      seo: z.object({
        metaTitle: z.string().max(70).optional(),
        metaDesc: z.string().max(160).optional(),
      }),
    })
  ).min(1).max(50),
});

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN and CONTENT_EDITOR can access SEO
      const allowedRoles = [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR];
      if (!allowedRoles.includes(req.adminUser.role as AdminRole)) {
        return NextResponse.json(
          { error: 'Không có quyền truy cập module SEO' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const perPage = parseInt(searchParams.get('per_page') || '20', 10);
      const search = searchParams.get('search') || '';

      const { categories, products } = await getCollections();

      // Build query
      const query: Record<string, unknown> = {
        deletedAt: null,
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await categories.countDocuments(query);

      // Get categories with pagination
      const categoriesList = await categories
        .find(query)
        .sort({ position: 1, name: 1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray();

      // Get product counts for each category
      const categoryIds = categoriesList.map(c => c._id.toString());
      const productCounts = await products.aggregate([
        {
          $match: {
            categoryIds: { $in: categoryIds },
            deletedAt: null,
          },
        },
        {
          $unwind: '$categoryIds',
        },
        {
          $match: {
            categoryIds: { $in: categoryIds },
          },
        },
        {
          $group: {
            _id: '$categoryIds',
            count: { $sum: 1 },
          },
        },
      ]).toArray();

      const countMap = new Map(productCounts.map(p => [p._id, p.count]));

      // Map to response format
      const items: CategorySEOItem[] = categoriesList.map(cat => ({
        _id: cat._id.toString(),
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId || null,
        seo: {
          metaTitle: cat.metaTitle,
          metaDesc: cat.metaDesc,
        },
        productCount: countMap.get(cat._id.toString()) || 0,
        status: cat.status || 'active',
        updatedAt: cat.updatedAt,
      }));

      return NextResponse.json({
        categories: items,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      });
    } catch (error) {
      console.error('[Categories SEO API] GET Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy danh sách categories' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Ensure adminUser is defined
      if (!req.adminUser) {
        return NextResponse.json(
          { error: 'Không được phép truy cập' },
          { status: 401 }
        );
      }

      // RBAC: Only SUPER_ADMIN and CONTENT_EDITOR can update SEO
      const allowedRoles = [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR];
      if (!allowedRoles.includes(req.adminUser.role as AdminRole)) {
        return NextResponse.json(
          { error: 'Không có quyền cập nhật SEO' },
          { status: 403 }
        );
      }

      const body = await request.json();

      // Validate request body
      const validation = BulkUpdateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { updates } = validation.data;
      const { categories } = await getCollections();

      // Process updates
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const update of updates) {
        try {
          const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
          };

          if (update.seo.metaTitle !== undefined) {
            updateData.metaTitle = update.seo.metaTitle;
          }
          if (update.seo.metaDesc !== undefined) {
            updateData.metaDesc = update.seo.metaDesc;
          }

          const result = await categories.updateOne(
            { _id: new ObjectId(update.categoryId) },
            { $set: updateData }
          );

          if (result.matchedCount > 0) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Category ${update.categoryId} không tìm thấy`);
          }
        } catch (err) {
          results.failed++;
          results.errors.push(`Lỗi cập nhật category ${update.categoryId}`);
        }
      }

      return NextResponse.json({
        message: `Đã cập nhật ${results.success} categories`,
        ...results,
      });
    } catch (error) {
      console.error('[Categories SEO API] PATCH Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi cập nhật SEO categories' },
        { status: 500 }
      );
    }
  });
}
