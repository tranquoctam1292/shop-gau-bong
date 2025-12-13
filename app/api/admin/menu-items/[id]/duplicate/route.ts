/**
 * Admin Menu Item Duplicate API Route
 * POST /api/admin/menu-items/{id}/duplicate - Duplicate a menu item
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { menus, menuItems } = await getCollections();
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu item ID' }, { status: 400 });
    }
    
    const itemId = new ObjectId(id);
    
    // Find menu item
    const item = await menuItems.findOne({ _id: itemId });
    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    // Get max order for this menu (or parent if nested)
    const orderQuery: any = { menuId: item.menuId };
    if (item.parentId) {
      orderQuery.parentId = item.parentId;
    } else {
      orderQuery.parentId = null;
    }
    
    const maxOrderItem = await menuItems
      .find(orderQuery)
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    
    const order = maxOrderItem.length > 0 ? maxOrderItem[0].order + 1 : 0;
    
    // Create duplicate
    const now = new Date();
    const duplicateItem = {
      menuId: item.menuId,
      parentId: item.parentId,
      title: item.title ? `${item.title} (Copy)` : null,
      type: item.type,
      referenceId: item.referenceId,
      url: item.url,
      target: item.target,
      iconClass: item.iconClass,
      cssClass: item.cssClass,
      order,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await menuItems.insertOne(duplicateItem);
    
    // Clear cache for the menu's location
    const menu = await menus.findOne({ _id: item.menuId });
    if (menu?.location) {
      try {
        await fetch(`${request.nextUrl.origin}/api/cms/menus/location/${menu.location}`, {
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
    
    // Get created item
    const createdItem = await menuItems.findOne({ _id: result.insertedId });
    
    if (!createdItem) {
      return NextResponse.json(
        { error: 'Failed to duplicate menu item' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Menu item duplicated successfully',
      item: {
        id: createdItem._id.toString(),
        menuId: createdItem.menuId.toString(),
        parentId: createdItem.parentId ? createdItem.parentId.toString() : null,
        title: createdItem.title,
        type: createdItem.type,
        referenceId: createdItem.referenceId ? createdItem.referenceId.toString() : null,
        url: createdItem.url || null,
        target: createdItem.target,
        iconClass: createdItem.iconClass || null,
        cssClass: createdItem.cssClass || null,
        order: createdItem.order,
        createdAt: createdItem.createdAt,
        updatedAt: createdItem.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Menu Item Duplicate API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to duplicate menu item',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

