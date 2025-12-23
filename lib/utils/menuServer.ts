/**
 * Server-side Menu Utilities
 * 
 * Functions to fetch menu data on the server with caching
 * Used to prevent render blocking and improve performance
 */

import { unstable_cache } from 'next/cache';
import { getCollections, ObjectId } from '@/lib/db';
import { resolveMenuItemLinksBatch } from '@/lib/utils/menuUtils';

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  target: '_self' | '_blank';
  iconClass: string | null;
  cssClass: string | null;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
}

/**
 * Fetch menu by location from database (server-side)
 * 
 * This function directly queries MongoDB instead of calling API route
 * to avoid unnecessary HTTP overhead in server components
 */
async function fetchMenuFromDB(location: string): Promise<Menu | null> {
  try {
    const { menus, menuItems } = await getCollections();
    
    // Get active menu for this location
    const menu = await menus.findOne({
      location,
      status: 'active',
    });
    
    if (!menu) {
      return null;
    }
    
    // Get all menu items for this menu
    const items = await menuItems
      .find({ menuId: menu._id })
      .sort({ order: 1 })
      .toArray();
    
    // Batch resolve all menu item links to avoid N+1 queries
    const itemsToResolve = items.map((item) => ({
      type: item.type,
      url: item.url || null,
      referenceId: item.referenceId || null,
      title: item.title || null,
    }));
    
    const resolvedMap = await resolveMenuItemLinksBatch(itemsToResolve);
    
    // Map resolved results back to items
    const resolvedItems = items.map((item, index) => {
      const key = `${item.type}-${item.referenceId || index}`;
      const resolved = resolvedMap.get(key);
      
      if (!resolved) {
        // Fallback: return null if resolution failed
        return null;
      }
      
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
    });
    
    // Filter out items with deleted/inactive references and ghost links
    const validItems = resolvedItems.filter((item) => {
      if (!item) return false;
      // Filter out ghost links (url === '#' or invalid)
      if (!item.resolvedUrl || item.resolvedUrl === '#') {
        return false;
      }
      return true;
    }) as any[];
    
    // Build tree structure with resolved values directly
    const buildTreeWithResolved = (parentId: ObjectId | null = null): MenuItem[] => {
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
    
    return {
      id: menu._id.toString(),
      name: menu.name,
      location: menu.location,
      items: finalTree,
    };
  } catch (error) {
    console.error('[Menu Server] Error fetching menu:', error);
    return null;
  }
}

/**
 * Cached function to get menu by location
 * 
 * ✅ PERFORMANCE: Cache menu structure for 5 minutes (300 seconds)
 * Menu structure rarely changes, so aggressive caching is safe
 * 
 * @param location - Menu location (e.g., 'primary', 'footer', 'mobile')
 * @returns Menu data or null if not found
 */
export const getCachedMenu = unstable_cache(
  async (location: string): Promise<Menu | null> => {
    return await fetchMenuFromDB(location);
  },
  ['menu'], // Cache key prefix
  {
    tags: ['menu'], // Tag for cache invalidation
    revalidate: 300, // Cache for 5 minutes (same as API route cache)
  }
);

