/**
 * Public Menu API Route
 * GET /api/cms/menus/location/{location} - Get menu by location (for frontend rendering)
 * 
 * Public endpoint - no authentication required
 * Cached for 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { resolveMenuItemLink } from '@/lib/utils/menuUtils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { location: string } }
) {
  try {
    const { menus, menuItems } = await getCollections();
    const { location } = params;
    
    // Get active menu for this location
    const menu = await menus.findOne({
      location,
      status: 'active',
    });
    
    if (!menu) {
      return NextResponse.json(
        {
          menu: null,
          message: `No active menu found for location: ${location}`,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }
    
    // Get all menu items for this menu
    const items = await menuItems
      .find({ menuId: menu._id })
      .sort({ order: 1 })
      .toArray();
    
    // Resolve references and filter valid items
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        // Resolve link for this item
        const resolved = await resolveMenuItemLink({
          type: item.type,
          url: item.url || null,
          referenceId: item.referenceId || null,
          title: item.title || null,
        });
        
        // Only include item if reference exists and is active (or if it's a custom link)
        if (item.type === 'custom' || (resolved.exists && resolved.active)) {
          return {
            ...item,
            resolvedUrl: resolved.url,
            resolvedTitle: resolved.title,
            exists: resolved.exists,
            active: resolved.active,
          };
        }
        
        // Return null for items with deleted/inactive references (will be filtered out)
        return null;
      })
    );
    
    // Filter out items with deleted/inactive references
    const validItems = resolvedItems.filter((item) => item !== null) as any[];
    
    // Build tree structure with resolved values directly
    const buildTreeWithResolved = (parentId: ObjectId | null = null): any[] => {
      return validItems
        .filter((item) => {
          if (parentId === null) {
            return !item.parentId;
          }
          return item.parentId?.toString() === parentId.toString();
        })
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: item._id.toString(),
          title: item.resolvedTitle || item.title || 'Untitled',
          url: item.resolvedUrl || item.url || '#',
          target: item.target,
          iconClass: item.iconClass || null,
          cssClass: item.cssClass || null,
          children: buildTreeWithResolved(item._id),
        }));
    };
    
    const finalTree = buildTreeWithResolved();
    
    return NextResponse.json(
      {
        menu: {
          id: menu._id.toString(),
          name: menu.name,
          location: menu.location,
          items: finalTree,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          // 5 minutes cache, 10 minutes stale-while-revalidate
        },
      }
    );
  } catch (error: any) {
    console.error('[Public Menu API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch menu',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}
