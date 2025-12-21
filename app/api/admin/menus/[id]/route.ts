/**
 * Admin Menu Detail API Route
 * GET /api/admin/menus/{id} - Get menu detail with items
 * PUT /api/admin/menus/{id} - Update menu
 * DELETE /api/admin/menus/{id} - Delete menu
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { resolveMenuItemLink } from '@/lib/utils/menuUtils';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { Permission } from '@/types/admin';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

// Menu update schema
const menuUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

/**
 * Build tree structure from flat menu items list
 * FIX: Include referenceStatus (exists, active) to avoid N+1 API calls
 */
function buildMenuTree(items: any[], parentId: string | null = null, referenceStatusMap?: Map<string, { exists: boolean; active: boolean; url: string; title: string }>): any[] {
  return items
    .filter((item) => {
      if (parentId === null) {
        return !item.parentId;
      }
      return item.parentId?.toString() === parentId;
    })
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const itemId = item._id.toString();
      const referenceStatus = referenceStatusMap?.get(itemId);
      
      return {
        id: itemId,
        title: item.title,
        type: item.type,
        referenceId: item.referenceId ? item.referenceId.toString() : null,
        url: item.url || null,
        target: item.target,
        iconClass: item.iconClass || null,
        cssClass: item.cssClass || null,
        order: item.order,
        // FIX: Include reference status to avoid frontend N+1 API calls
        referenceStatus: referenceStatus ? {
          exists: referenceStatus.exists,
          active: referenceStatus.active,
          url: referenceStatus.url,
          title: referenceStatus.title,
        } : undefined,
        children: buildMenuTree(items, item._id.toString(), referenceStatusMap),
      };
    });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { menus, menuItems } = await getCollections();
      const { id } = params;
      const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'tree'; // 'tree' | 'flat'
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu ID' }, { status: 400 });
    }
    
    const menuId = new ObjectId(id);
    
    // Get menu
    const menu = await menus.findOne({ _id: menuId });
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    
    // Get menu items
    const items = await menuItems
      .find({ menuId })
      .sort({ order: 1 })
      .toArray();
    
    // FIX: Batch resolve link status for all items to avoid N+1 API calls
    // Resolve all items in parallel
    const referenceStatusMap = new Map<string, { exists: boolean; active: boolean; url: string; title: string }>();
    await Promise.all(
      items.map(async (item) => {
        try {
          const resolved = await resolveMenuItemLink({
            type: item.type,
            url: item.url || null,
            referenceId: item.referenceId || null,
            title: item.title || null,
          });
          referenceStatusMap.set(item._id.toString(), resolved);
        } catch (error) {
          // If resolve fails, set default values
          referenceStatusMap.set(item._id.toString(), {
            exists: false,
            active: false,
            url: '#',
            title: item.title || 'Unknown',
          });
        }
      })
    );
    
    // Format response
    if (format === 'flat') {
      return NextResponse.json({
        menu: {
          id: menu._id.toString(),
          name: menu.name,
          location: menu.location || null,
          status: menu.status,
          items: items.map((item) => {
            const itemId = item._id.toString();
            const referenceStatus = referenceStatusMap.get(itemId);
            
            return {
              id: itemId,
              title: item.title,
              type: item.type,
              referenceId: item.referenceId ? item.referenceId.toString() : null,
              url: item.url || null,
              target: item.target,
              iconClass: item.iconClass || null,
              cssClass: item.cssClass || null,
              parentId: item.parentId ? item.parentId.toString() : null,
              order: item.order,
              // FIX: Include reference status to avoid frontend N+1 API calls
              referenceStatus: referenceStatus ? {
                exists: referenceStatus.exists,
                active: referenceStatus.active,
                url: referenceStatus.url,
                title: referenceStatus.title,
              } : undefined,
            };
          }),
        },
      });
    } else {
      // Tree format
      const treeItems = buildMenuTree(items, null, referenceStatusMap);
      
      return NextResponse.json({
        menu: {
          id: menu._id.toString(),
          name: menu.name,
          location: menu.location || null,
          status: menu.status,
          items: treeItems,
        },
      });
    }
  } catch (error: any) {
    console.error('[Admin Menu Detail API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch menu',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:read' as Permission); // Menu GET requires read permission
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { menus } = await getCollections();
      const { id } = params;
      const body = await req.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu ID' }, { status: 400 });
    }
    
    const menuId = new ObjectId(id);
    
    // Check if menu exists
    const existingMenu = await menus.findOne({ _id: menuId });
    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    
    // Validate input
    const validatedData = menuUpdateSchema.parse(body);
    
    // Determine final values after update
    const finalLocation = validatedData.location !== undefined 
      ? validatedData.location 
      : existingMenu.location;
    const finalStatus = validatedData.status !== undefined 
      ? validatedData.status 
      : existingMenu.status;
    
    // Check for location conflicts:
    // 1. If setting location to a new value, check if another menu (with any status) has that location
    // 2. If setting status to active with a location, check if another active menu has that location
    // Note: MongoDB sparse unique index allows only 1 document per location value
    if (validatedData.location !== undefined && finalLocation) {
      // Check if another menu (any status) already has this location
      const conflictingMenu = await menus.findOne({
        _id: { $ne: menuId },
        location: finalLocation,
      });
      
      if (conflictingMenu) {
        // If we're setting this menu to active, set conflicting menu to inactive
        if (finalStatus === 'active') {
          await menus.updateOne(
            { _id: conflictingMenu._id },
            { $set: { status: 'inactive', updatedAt: new Date() } }
          );
        } else {
          // If we're setting this menu to inactive but location conflicts, reject
          return NextResponse.json(
            { error: `Another menu already has location "${finalLocation}". Please choose a different location or set the other menu to inactive first.` },
            { status: 400 }
          );
        }
      }
    } else if (validatedData.status === 'active' && finalLocation) {
      // If only status is being updated to active (location unchanged), check for active conflicts
      const conflictingMenu = await menus.findOne({
        _id: { $ne: menuId },
        location: finalLocation,
        status: 'active',
      });
      
      if (conflictingMenu) {
        // Set conflicting menu to inactive
        await menus.updateOne(
          { _id: conflictingMenu._id },
          { $set: { status: 'inactive', updatedAt: new Date() } }
        );
      }
    }
    
    // Update menu
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await menus.updateOne({ _id: menuId }, { $set: updateData });
    
    // ✅ PERFORMANCE: Invalidate menu cache using revalidateTag
    try {
      revalidateTag('menu'); // Invalidate all menu caches
    } catch (revalidateError) {
      console.warn('[Cache Invalidation] Failed to revalidate menu cache:', revalidateError);
    }
    
    // Get updated menu
    const updatedMenu = await menus.findOne({ _id: menuId });
    
    return NextResponse.json({
      message: 'Menu updated successfully',
      menu: {
        id: updatedMenu!._id.toString(),
        name: updatedMenu!.name,
        location: updatedMenu!.location || null,
        status: updatedMenu!.status,
        createdAt: updatedMenu!.createdAt,
        updatedAt: updatedMenu!.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Menu Detail API] Error:', error);
    
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
        error: error.message || 'Failed to update menu',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:update' as Permission); // Menu PUT requires update permission
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
      return NextResponse.json({ error: 'Invalid menu ID' }, { status: 400 });
    }
    
    const menuId = new ObjectId(id);
    
    // Check if menu exists
    const menu = await menus.findOne({ _id: menuId });
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    
    // Delete all menu items first
    await menuItems.deleteMany({ menuId });
    
    // Delete menu
    await menus.deleteOne({ _id: menuId });
    
    // Clear cache if menu had a location
    if (menu.location) {
      try {
        await fetch(`${request.nextUrl.origin}/api/cms/menus/location/${menu.location}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }).catch(() => {
          // Ignore errors - cache will be stale until next request
        });
      } catch {
        // Ignore cache invalidation errors
      }
    }
    
    return NextResponse.json({
      message: 'Menu deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Menu Detail API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete menu',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:delete' as Permission); // Menu DELETE requires delete permission
}

