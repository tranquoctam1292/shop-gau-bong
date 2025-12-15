/**
 * Admin Menu Item Detail API Route
 * GET /api/admin/menu-items/{id} - Get menu item detail
 * PUT /api/admin/menu-items/{id} - Update menu item
 * DELETE /api/admin/menu-items/{id} - Delete menu item
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { Permission } from '@/types/admin';

export const dynamic = 'force-dynamic';

// Menu item update schema
const menuItemUpdateSchema = z.object({
  title: z.string().nullable().optional(),
  type: z.enum(['custom', 'category', 'page', 'product', 'post']).optional(),
  referenceId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  target: z.enum(['_self', '_blank']).optional(),
  iconClass: z.string().nullable().optional(),
  cssClass: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

/**
 * Get depth of a menu item (0 = root, 1 = child, 2 = grandchild)
 */
async function getItemDepth(menuItems: any, itemId: ObjectId): Promise<number> {
  const item = await menuItems.findOne({ _id: itemId });
  if (!item || !item.parentId) {
    return 0;
  }
  return 1 + await getItemDepth(menuItems, item.parentId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { menuItems } = await getCollections();
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu item ID' }, { status: 400 });
    }
    
    const itemId = new ObjectId(id);
    
    // Get menu item
    const item = await menuItems.findOne({ _id: itemId });
    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      item: {
        id: item._id.toString(),
        menuId: item.menuId.toString(),
        parentId: item.parentId ? item.parentId.toString() : null,
        title: item.title,
        type: item.type,
        referenceId: item.referenceId ? item.referenceId.toString() : null,
        url: item.url || null,
        target: item.target,
        iconClass: item.iconClass || null,
        cssClass: item.cssClass || null,
        order: item.order,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Menu Item Detail API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch menu item',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:read' as Permission); // Menu item GET requires menu read permission
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { menus, menuItems } = await getCollections();
      const { id } = params;
      const body = await req.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu item ID' }, { status: 400 });
    }
    
    const itemId = new ObjectId(id);
    
    // Check if item exists
    const existingItem = await menuItems.findOne({ _id: itemId });
    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    // Validate input
    const validatedData = menuItemUpdateSchema.parse(body);
    
    // Validate parentId if being changed
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId) {
        if (!ObjectId.isValid(validatedData.parentId)) {
          return NextResponse.json({ error: 'Invalid parent ID' }, { status: 400 });
        }
        
        const parentId = new ObjectId(validatedData.parentId);
        
        // Check if parent exists and is in same menu
        const parentItem = await menuItems.findOne({
          _id: parentId,
          menuId: existingItem.menuId,
        });
        if (!parentItem) {
          return NextResponse.json({ error: 'Parent item not found' }, { status: 404 });
        }
        
        // Prevent circular reference (item cannot be its own parent or ancestor)
        if (parentId.equals(itemId)) {
          return NextResponse.json(
            { error: 'Item cannot be its own parent' },
            { status: 400 }
          );
        }
        
        // Check if parent is a descendant of this item (would create circular reference)
        let currentParentId = parentId;
        for (let i = 0; i < 10; i++) { // Max 10 iterations to prevent infinite loop
          const currentParent = await menuItems.findOne({ _id: currentParentId });
          if (!currentParent || !currentParent.parentId) {
            break;
          }
          if (currentParent.parentId.equals(itemId)) {
            return NextResponse.json(
              { error: 'Circular reference detected' },
              { status: 400 }
            );
          }
          currentParentId = currentParent.parentId;
        }
        
        // Validate max depth
        const depth = await getItemDepth(menuItems, parentId);
        if (depth >= 2) {
          return NextResponse.json(
            { error: 'Maximum depth exceeded (max 3 levels)' },
            { status: 400 }
          );
        }
      }
    }
    
    // Validate type-specific requirements
    const finalType = validatedData.type || existingItem.type;
    if (finalType === 'custom') {
      const finalUrl = validatedData.url !== undefined ? validatedData.url : existingItem.url;
      if (!finalUrl) {
        return NextResponse.json(
          { error: 'URL is required for custom links' },
          { status: 400 }
        );
      }
    } else {
      const finalReferenceId = validatedData.referenceId !== undefined
        ? validatedData.referenceId
        : (existingItem.referenceId ? existingItem.referenceId.toString() : null);
      if (!finalReferenceId) {
        return NextResponse.json(
          { error: 'Reference ID is required for non-custom items' },
          { status: 400 }
        );
      }
      if (!ObjectId.isValid(finalReferenceId)) {
        return NextResponse.json({ error: 'Invalid reference ID' }, { status: 400 });
      }
    }
    
    // Update menu item
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.referenceId !== undefined) {
      updateData.referenceId = validatedData.referenceId
        ? new ObjectId(validatedData.referenceId)
        : null;
    }
    if (validatedData.url !== undefined) updateData.url = validatedData.url;
    if (validatedData.target !== undefined) updateData.target = validatedData.target;
    if (validatedData.iconClass !== undefined) updateData.iconClass = validatedData.iconClass;
    if (validatedData.cssClass !== undefined) updateData.cssClass = validatedData.cssClass;
    if (validatedData.parentId !== undefined) {
      updateData.parentId = validatedData.parentId
        ? new ObjectId(validatedData.parentId)
        : null;
    }
    if (validatedData.order !== undefined) updateData.order = validatedData.order;
    
    await menuItems.updateOne({ _id: itemId }, { $set: updateData });
    
    // Clear cache for the menu's location
    const menu = await menus.findOne({ _id: existingItem.menuId });
    if (menu?.location) {
      try {
        await fetch(`${req.nextUrl.origin}/api/cms/menus/location/${menu.location}`, {
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
    
    // Get updated item
    const updatedItem = await menuItems.findOne({ _id: itemId });
    
    return NextResponse.json({
      message: 'Menu item updated successfully',
      item: {
        id: updatedItem!._id.toString(),
        menuId: updatedItem!.menuId.toString(),
        parentId: updatedItem!.parentId ? updatedItem!.parentId.toString() : null,
        title: updatedItem!.title,
        type: updatedItem!.type,
        referenceId: updatedItem!.referenceId ? updatedItem!.referenceId.toString() : null,
        url: updatedItem!.url || null,
        target: updatedItem!.target,
        iconClass: updatedItem!.iconClass || null,
        cssClass: updatedItem!.cssClass || null,
        order: updatedItem!.order,
        createdAt: updatedItem!.createdAt,
        updatedAt: updatedItem!.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Menu Item Detail API] Error:', error);
    
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
        error: error.message || 'Failed to update menu item',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:update' as Permission); // Menu item PUT requires menu update permission
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { menus, menuItems } = await getCollections();
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu item ID' }, { status: 400 });
    }
    
    const itemId = new ObjectId(id);
    
    // Check if item exists
    const item = await menuItems.findOne({ _id: itemId });
    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    // Check if item has children
    const childrenCount = await menuItems.countDocuments({ parentId: itemId });
    if (childrenCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete item with children. Please delete children first.',
          childrenCount,
        },
        { status: 400 }
      );
    }
    
    // Delete menu item
    await menuItems.deleteOne({ _id: itemId });
    
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
    
    return NextResponse.json({
      message: 'Menu item deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Menu Item Detail API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete menu item',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:update'); // Menu item DELETE requires menu update permission
}

