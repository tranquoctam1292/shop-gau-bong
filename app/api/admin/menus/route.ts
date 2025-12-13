/**
 * Admin Menus API Route
 * GET /api/admin/menus - List menus (with filters)
 * POST /api/admin/menus - Create new menu
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Menu schema for validation
const menuSchema = z.object({
  name: z.string().min(1, 'Tên menu không được để trống'),
  location: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { menus, menuItems } = await getCollections();
    const searchParams = request.nextUrl.searchParams;
    
    // Filter parameters
    const location = searchParams.get('location');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);
    
    // Build query
    const query: any = {};
    if (location) {
      query.location = location;
    }
    if (status) {
      query.status = status;
    }
    
    // Get total count
    const total = await menus.countDocuments(query);
    
    // Fetch menus with pagination
    const menusList = await menus
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .toArray();
    
    // Optimize: Use aggregation to get item counts for all menus in one query (avoid N+1)
    const menuIds = menusList.map((menu) => menu._id);
    const itemCountsAggregation = await menuItems
      .aggregate([
        {
          $match: {
            menuId: { $in: menuIds },
          },
        },
        {
          $group: {
            _id: '$menuId',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();
    
    // Create a map of menuId -> count for quick lookup
    const itemCountMap = new Map<string, number>();
    itemCountsAggregation.forEach((item) => {
      itemCountMap.set(item._id.toString(), item.count);
    });
    
    // Map menus with item counts
    const menusWithCounts = menusList.map((menu) => ({
      id: menu._id.toString(),
      name: menu.name,
      location: menu.location || null,
      status: menu.status,
      itemCount: itemCountMap.get(menu._id.toString()) || 0,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    }));
    
    return NextResponse.json({
      menus: menusWithCounts,
      pagination: {
        total,
        totalPages: Math.ceil(total / perPage),
        currentPage: page,
        perPage,
        hasNextPage: page * perPage < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[Admin Menus API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch menus',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { menus } = await getCollections();
    const body = await request.json();
    
    // Validate input
    const validatedData = menuSchema.parse(body);
    
    // Check for location conflicts:
    // MongoDB sparse unique index allows only 1 document per location value
    // If location is provided, check if another menu (any status) already has that location
    if (validatedData.location) {
      const existingMenu = await menus.findOne({
        location: validatedData.location,
      });
      
      if (existingMenu) {
        // If we're creating an active menu, set existing menu to inactive
        if (validatedData.status === 'active') {
          await menus.updateOne(
            { _id: existingMenu._id },
            { $set: { status: 'inactive', updatedAt: new Date() } }
          );
        } else {
          // If we're creating an inactive menu but location conflicts, reject
          return NextResponse.json(
            { error: `Another menu already has location "${validatedData.location}". Please choose a different location or set the other menu to inactive first.` },
            { status: 400 }
          );
        }
      }
    }
    
    // Create new menu
    const now = new Date();
    const newMenu = {
      name: validatedData.name,
      location: validatedData.location || null,
      status: validatedData.status,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await menus.insertOne(newMenu);
    
    // Clear cache if location is set and status is active
    if (validatedData.location && validatedData.status === 'active') {
      try {
        await fetch(`${request.nextUrl.origin}/api/cms/menus/location/${validatedData.location}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }).catch(() => {
          // Ignore errors
        });
      } catch {
        // Ignore cache invalidation errors
      }
    }
    
    return NextResponse.json(
      {
        message: 'Menu created successfully',
        menu: {
          id: result.insertedId.toString(),
          ...newMenu,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Menus API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to create menu',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

