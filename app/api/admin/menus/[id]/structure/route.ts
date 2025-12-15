/**
 * Admin Menu Structure Update API Route
 * POST /api/admin/menus/{id}/structure - Bulk update menu structure (for Drag & Drop)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { Permission } from '@/types/admin';

export const dynamic = 'force-dynamic';

// Structure item schema
type StructureItem = {
  id: string;
  children: StructureItem[];
};

const structureItemSchema: z.ZodType<StructureItem> = z.object({
  id: z.string(),
  children: z.array(z.lazy(() => structureItemSchema)),
}).transform((data) => ({
  ...data,
  children: data.children || [],
}));

const structureSchema = z.array(structureItemSchema);

/**
 * Calculate max depth of a structure item
 * Returns the maximum depth from this item (0 = root, 1 = child, 2 = grandchild)
 */
function calculateMaxDepth(item: StructureItem, currentDepth: number = 0): number {
  // Current item is at currentDepth
  let maxDepth = currentDepth;
  
  // Check children
  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      const childDepth = calculateMaxDepth(child, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  }
  
  return maxDepth;
}

/**
 * Validate structure depth (max 3 levels: 0, 1, 2)
 * Level 0 = root items, Level 1 = children, Level 2 = grandchildren
 * Level 3 = great-grandchildren (should be rejected)
 */
function validateStructureDepth(structure: any[]): { valid: boolean; maxDepth: number; error?: string } {
  if (structure.length === 0) {
    return { valid: true, maxDepth: 0 };
  }
  
  const depths = structure.map((item) => calculateMaxDepth(item, 0));
  const maxDepth = Math.max(...depths);
  
  if (maxDepth >= 3) {
    return {
      valid: false,
      maxDepth,
      error: `Maximum depth exceeded. Max allowed: 3 levels (0, 1, 2), found: ${maxDepth}`,
    };
  }
  
  return { valid: true, maxDepth };
}

/**
 * Flatten structure to update list
 * 
 * Order calculation:
 * - Root items: 0, 1, 2, 3...
 * - Children of item 0: 0, 1, 2... (order is relative to parent)
 * - Children of item 1: 0, 1, 2... (order is relative to parent)
 * 
 * This ensures each parent's children are ordered 0, 1, 2... independently
 */
function flattenStructure(
  structure: any[],
  menuId: ObjectId,
  parentId: ObjectId | null = null,
  startOrder: number = 0
): Array<{ id: ObjectId; parentId: ObjectId | null; order: number }> {
  const updates: Array<{ id: ObjectId; parentId: ObjectId | null; order: number }> = [];
  let currentOrder = startOrder;
  
  for (const item of structure) {
    if (!ObjectId.isValid(item.id)) {
      continue;
    }
    
    const itemId = new ObjectId(item.id);
    
    // Add current item with its order (relative to its parent)
    updates.push({
      id: itemId,
      parentId,
      order: currentOrder++,
    });
    
    // Process children recursively (children always start at order 0 relative to their parent)
    if (item.children && item.children.length > 0) {
      const childUpdates = flattenStructure(item.children, menuId, itemId, 0);
      updates.push(...childUpdates);
      // Note: We don't increment currentOrder for children because children have their own order sequence (0, 1, 2...)
      // The order field is relative to the parent, not global
    }
  }
  
  return updates;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { menus, menuItems } = await getCollections();
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
    const validatedStructure = structureSchema.parse(body);
    
    // Validate depth
    const depthValidation = validateStructureDepth(validatedStructure);
    if (!depthValidation.valid) {
      return NextResponse.json(
        {
          error: depthValidation.error,
          maxDepth: depthValidation.maxDepth,
        },
        { status: 400 }
      );
    }
    
    // Get all existing menu items for this menu
    const existingItems = await menuItems
      .find({ menuId })
      .toArray();
    
    const existingItemIds = new Set(
      existingItems.map((item) => item._id.toString())
    );
    
    // Validate all IDs in structure exist
    const structureItemIds = new Set<string>();
    const collectIds = (items: any[]) => {
      for (const item of items) {
        if (!ObjectId.isValid(item.id)) {
          throw new Error(`Invalid item ID: ${item.id}`);
        }
        if (!existingItemIds.has(item.id)) {
          throw new Error(`Menu item not found: ${item.id}`);
        }
        if (structureItemIds.has(item.id)) {
          throw new Error(`Duplicate item ID in structure: ${item.id}`);
        }
        structureItemIds.add(item.id);
        if (item.children && item.children.length > 0) {
          collectIds(item.children);
        }
      }
    };
    
    collectIds(validatedStructure);
    
    // Check if all existing items are in structure (prevent orphaned items)
    // Note: We allow some items to be missing (they will be orphaned, but that's OK for now)
    // In future, we might want to handle orphaned items differently
    
    // Flatten structure to get update list
    const updates = flattenStructure(validatedStructure, menuId);
    
    // Update all items in a transaction-like manner (using bulk operations)
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id, menuId },
        update: {
          $set: {
            parentId: update.parentId,
            order: update.order,
            updatedAt: new Date(),
          },
        },
      },
    }));
    
    if (bulkOps.length > 0) {
      await menuItems.bulkWrite(bulkOps);
    }
    
    // Clear cache for this menu location (if exists)
    if (existingMenu.location) {
      try {
        await fetch(`${request.nextUrl.origin}/api/cms/menus/location/${existingMenu.location}`, {
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
    
    // Get updated menu structure (tree format)
    const updatedItems = await menuItems
      .find({ menuId })
      .sort({ order: 1 })
      .toArray();
    
    // Build tree structure
    const buildTree = (parentId: ObjectId | null = null): any[] => {
      return updatedItems
        .filter((item) => {
          if (parentId === null) {
            return !item.parentId;
          }
          return item.parentId?.toString() === parentId.toString();
        })
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: item._id.toString(),
          title: item.title,
          type: item.type,
          referenceId: item.referenceId ? item.referenceId.toString() : null,
          url: item.url || null,
          target: item.target,
          iconClass: item.iconClass || null,
          cssClass: item.cssClass || null,
          order: item.order,
          children: buildTree(item._id),
        }));
    };
    
    const treeStructure = buildTree();
    
    return NextResponse.json({
      message: 'Menu structure updated successfully',
      structure: treeStructure,
      updatedCount: updates.length,
    });
  } catch (error: any) {
    console.error('[Admin Menu Structure API] Error:', error);
    
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
        error: error.message || 'Failed to update menu structure',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'menu:update' as Permission); // Menu structure update requires update permission
}

