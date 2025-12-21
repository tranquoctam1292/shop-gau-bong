/**
 * Admin Menu Items API Route
 * POST /api/admin/menu-items - Create new menu item
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { Permission } from '@/types/admin';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

// Menu item schema for validation
const menuItemSchema = z.object({
  menuId: z.string().min(1, 'Menu ID không được để trống'),
  parentId: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z.enum(['custom', 'category', 'page', 'product', 'post']),
  referenceId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  target: z.enum(['_self', '_blank']).default('_self'),
  iconClass: z.string().nullable().optional(),
  cssClass: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { menus, menuItems } = await getCollections();
      const body = await req.json();
    
    // Validate input
    const validatedData = menuItemSchema.parse(body);
    
    // Validate menuId
    if (!ObjectId.isValid(validatedData.menuId)) {
      return NextResponse.json({ error: 'Invalid menu ID' }, { status: 400 });
    }
    
    const menuId = new ObjectId(validatedData.menuId);
    
    // Check if menu exists
    const menu = await menus.findOne({ _id: menuId });
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    
    // Validate parentId if provided
    if (validatedData.parentId) {
      if (!ObjectId.isValid(validatedData.parentId)) {
        return NextResponse.json({ error: 'Invalid parent ID' }, { status: 400 });
      }
      
      const parentId = new ObjectId(validatedData.parentId);
      const parentItem = await menuItems.findOne({ _id: parentId, menuId });
      if (!parentItem) {
        return NextResponse.json({ error: 'Parent item not found' }, { status: 404 });
      }
      
      // Validate max depth (3 levels: 0, 1, 2)
      const depth = await getItemDepth(menuItems, parentId);
      if (depth >= 2) {
        return NextResponse.json(
          { error: 'Maximum depth exceeded (max 3 levels)' },
          { status: 400 }
        );
      }
    }
    
    // Validate type-specific requirements
    if (validatedData.type === 'custom' || validatedData.type === 'page') {
      // Custom links and pages use URL instead of referenceId
      if (!validatedData.url) {
        return NextResponse.json(
          { error: `URL is required for ${validatedData.type} items` },
          { status: 400 }
        );
      }
    } else {
      // Categories, products, posts require referenceId (ObjectId)
      if (!validatedData.referenceId) {
        return NextResponse.json(
          { error: 'Reference ID is required for non-custom/page items' },
          { status: 400 }
        );
      }
      if (!ObjectId.isValid(validatedData.referenceId)) {
        return NextResponse.json({ error: 'Invalid reference ID' }, { status: 400 });
      }
    }
    
    // Get max order for this menu (or parent if nested)
    const orderQuery: any = { menuId };
    if (validatedData.parentId) {
      orderQuery.parentId = new ObjectId(validatedData.parentId);
    } else {
      orderQuery.parentId = null;
    }
    
    const maxOrderItem = await menuItems
      .find(orderQuery)
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    
    const order = validatedData.order !== undefined
      ? validatedData.order
      : (maxOrderItem.length > 0 ? maxOrderItem[0].order + 1 : 0);
    
    // Create menu item
    const now = new Date();
    const newMenuItem = {
      menuId,
      parentId: validatedData.parentId ? new ObjectId(validatedData.parentId) : null,
      title: validatedData.title || null,
      type: validatedData.type,
      referenceId: validatedData.referenceId ? new ObjectId(validatedData.referenceId) : null,
      url: validatedData.url || null,
      target: validatedData.target,
      iconClass: validatedData.iconClass || null,
      cssClass: validatedData.cssClass || null,
      order,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await menuItems.insertOne(newMenuItem);
    
    // ✅ PERFORMANCE: Invalidate menu cache using revalidateTag
    try {
      revalidateTag('menu'); // Invalidate all menu caches
    } catch (revalidateError) {
      console.warn('[Cache Invalidation] Failed to revalidate menu cache:', revalidateError);
    }
    
    return NextResponse.json(
      {
        message: 'Menu item created successfully',
        item: {
          id: result.insertedId.toString(),
          ...newMenuItem,
          menuId: newMenuItem.menuId.toString(),
          parentId: newMenuItem.parentId?.toString() || null,
          referenceId: newMenuItem.referenceId?.toString() || null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Menu Items API] Error:', error);
    
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
        error: error.message || 'Failed to create menu item',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:update' as Permission); // Menu items POST requires menu update permission
}

/**
 * Get depth of a menu item (0 = root, 1 = child, 2 = grandchild)
 */
async function getItemDepth(menuItems: any, itemId: ObjectId): Promise<number> {
  const item = await menuItems.findOne({ _id: itemId });
  if (!item || !item.parentId) {
    return 0;
  }
  const parentDepth = await getItemDepth(menuItems, item.parentId);
  return 1 + parentDepth;
}

